from flask import Flask, render_template, Response

from picamera.array import PiRGBArray
from picamera import PiCamera

import cv2
import numpy as np

app = Flask(__name__)

lower = np.array([90, 130, 170], dtype="uint8")
upper = np.array([190, 220, 250], dtype="uint8")

camera = PiCamera()
camera.resolution = (1920, 1080)  # max resolution for video
camera.framerate = 15  # frame rate has to be 15 to enable max resolution
camera.brightness = 50  # default

raw_capture = PiRGBArray(camera, size=(1920, 1080))

# for frame in camera.capture_continuous(raw_capture, format="bgr", use_video_port=True):
#     img = frame.array
#     cv2.imshow("Original Image", img)
#     raw_capture.truncate(0)
#     if cv2.waitKey(1) & 0xFF==ord('q'):
#         break


vid = cv2.VideoCapture(0)
cv2.namedWindow('frame')

'''
for ip camera use - rtsp://username:password@ip_address:554/user=username_password='password'_channel=channel_number_stream=0.sdp' 
for local webcam use cv2.VideoCapture(0)
'''


def gen_frames():
    while (True):
        success, frame = vid.read()

        if not success:
            return
        else:

            mask = cv2.inRange(frame, lower, upper)
            output = cv2.bitwise_and(frame, frame, mask=mask)

            gray = cv2.cvtColor(output, cv2.COLOR_BGR2GRAY)

            thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)[1]

            contours = cv2.findContours(
                thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contours = contours[0] if len(contours) == 2 else contours[1]

            for cntr in contours:
                x, y, w, h = cv2.boundingRect(cntr)
                if not (w < 1000 and w > 300 and h < 1000 and h > 75):
                    continue

                cv2.rectangle(output, (x, y), (x+w, y+h), (0, 0, 255), 2)

                centerx = (x+(w/2))
                centery = (y+(h/2))
                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(output, str(centerx)+', '+str(centery),
                            (x, y), font, 1, (255, 0, 0), 2)

            success, buffer = cv2.imencode('.jpg', output)
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
        #cv2.imshow('frame', np.hstack([frame, output]))

        # if (cv2.waitKey(1) == ord('x')):
            # break


@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == "__main__":
    app.run(debug=True, port=3000)
