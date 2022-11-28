from typing import final
from flask import Flask, render_template, Response

from picamera.array import PiRGBArray
from picamera import PiCamera

import cv2
import numpy as np
import json
import requests

app = Flask(__name__)

lower = np.array([90, 130, 170], dtype="uint8")
upper = np.array([190, 220, 250], dtype="uint8")

# add picamera module
camera = PiCamera()
camera.resolution = (1920, 1080)  # max resolution for video
camera.framerate = 15  # frame rate has to be 15 to enable max resolution
camera.brightness = 50  # default

# unfinished - infrared camera instead of rgb
raw_capture = PiRGBArray(camera, size=(1920, 1080))


def filter_img(img):
    # change color conversion code
    img_gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
    img_blur = cv2.GaussianBlur(img_gray, (5, 5), 1)
    img_canny = cv2.Canny(img_blur, 128, 255)
    # order of dilation and erosion can be changed if needed
    # erosion -> dilation if needs to disconnect boundaries
    img_dilate = cv2.dilate(img_canny, np.ones((5, 5), np.uint8), iterations=1)
    img_erode = cv2.erode(img_dilate, np.ones((5, 5), np.uint8), iterations=1)
    return img_erode


def draw_rect(img, cnt):
    rect = cv2.minAreaRect(cnt)
    box = cv2.boxPoints(rect)
    box = np.int0(box)
    cv2.drawContours(img, [box], 0, (0, 0, 255), 2)


def get_centroid(cnt):
    M = cv2.moments(cnt)
    cx = int(M['m10']/M['m00'])
    cy = int(M['m01']/M['m00'])
    return (cx, cy)


# unfinished - change scale into a function
def map_coordinate(cx, cy, width, height, img):
    scale_x = '''from img_width to fish tank width'''
    scale_y = '''from img_height to fish tank height'''

    return (cx * scale_x / width * 2 - 1, cy * scale_y / height * 2 - 1)


def drive(raw_x, raw_y, caller='Fish', drive_mode='arcade'):
    data = json.dumps({raw_x, raw_y, caller,
                      drive_mode}, separators=(',', ':'))
    requests.post('/drive', data)


def gen_frames_pi():
    # display video
    for frame in camera.capture_continuous(raw_capture, format="bgr", use_video_port=True):
        img = frame.array
        img_contour = img.copy()
        img_rect = img.copy()

        # fish tank width and height - actual value needs to be tested
        width = 500
        height = 500

        # get contour
        contours = cv2.findContours(
            filter_img(img_contour), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)  # change to CHAIN_APPROX_NONE if necessary
        contours = contours[0] if len(contours) == 2 else contours[1]

        for cnt in contours:
            area = cv2.contourArea(cnt)
            print("area: " + str(area))
            if area > 200:  # draw contour if area bigger than certain threshold
                cv2.drawContours(img_contour, cnt, -1, (0, 255, 0), 2)
                draw_rect(img_rect, cnt)

                (raw_cx, raw_cy) = get_centroid(cnt)
                print("raw centroid x: " + str(raw_cx) +
                      "; raw centroid y: " + str(raw_cy))
                (cx, cy) = map_coordinate(raw_cx, raw_cy, width, height, img)
                print("centroid x: " + str(cx) + "; centroid y: " + str(cy))
                drive(cx, cy)

        cv2.imshow("Original Image", img)
        cv2.imshow("Contour Detection", img_contour)
        cv2.imshow("Rectangle Detection", img_rect)

        # truncate and clear stream for next iteration
        raw_capture.truncate(0)

        if cv2.waitKey(15) & 0xFF == ord('q'):  # tune wait time based on frame rate
            camera.close()
            break


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
    # return Response(gen_frames_pi(), mimetype='multipart/x-mixed-replace; boundary=frame')


if __name__ == "__main__":
    app.run(debug=True, port=3000)
