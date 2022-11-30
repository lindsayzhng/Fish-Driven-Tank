from flask import Flask, render_template, Response

from picamera.array import PiRGBArray
from picamera import PiCamera

import cv2
import numpy as np
import json
import requests

from constants import *


app = Flask(__name__)

# add picamera module
with PiCamera() as camera:
    camera.resolution = (FRAME_WIDTH, FRAME_HEIGHT)
    camera.framerate = FRAMERATE  # frame rate has to be 15 to enable max resolution
    camera.brightness = BRIGHTNESS  # default

    raw_capture = PiRGBArray(camera, size=(FRAME_WIDTH, FRAME_HEIGHT))

    def filter_img(img):
        img_blur = cv2.GaussianBlur(img, GAUSSIAN_KERNEL, GAUSSIAN_SIGMA)
        img_canny = cv2.Canny(img_blur, CANNY_LOWER_THRESHOLD,
                              CANNY_UPPER_THRESHOLD)
        # order of dilation and erosion can be changed if needed
        # erosion -> dilation if needs to disconnect boundaries
        img_dilate = cv2.dilate(img_canny, np.ones(
            DILATE_KERNEL, np.uint8), iterations=1)
        img_erode = cv2.erode(img_dilate, np.ones(
            ERODE_KERNEL, np.uint8), iterations=1)
        return img_erode

    def draw_rect(img, cnt):
        rect = cv2.minAreaRect(cnt)
        box = cv2.boxPoints(rect)
        box = np.int0(box)
        cv2.drawContours(img, [box], 0, CONTOUR_COLOR, CONTOUR_THICKNESS)

    def get_centroid(cnt):
        M = cv2.moments(cnt)
        cx = int(M['m10']/M['m00'])
        cy = int(M['m01']/M['m00'])
        return (cx, cy)

    def map_coordinate(cx, cy):  # assume that centroid coordinate in pixel unit
        return ((cx + X_OFFSET) / FRAME_WIDTH * 2 - 1, (cy + Y_OFFSET) / FRAME_HEIGHT * 2 - 1)

    def drive(raw_x, raw_y, caller='Fish', drive_mode='arcade'):
        data = {'rawX': raw_x, 'rawY': raw_y, 'caller': caller,
                'driveMode': drive_mode}
        requests.post('http://localhost:3030/drive', json=data)

    # lower = np.array([0, 40, 0], dtype="uint8")
    # upper = np.array([255, 255, 255], dtype="uint8")

   # lower = np.array([0, 0, 0], dtype="uint8")
   # upper = np.array([255, 255, 255], dtype="uint8")

    lower1 = np.array(HSV_LOWER_1, dtype="uint8")
    upper1 = np.array(HSV_UPPER_1, dtype="uint8")

    lower2 = np.array(HSV_LOWER_2, dtype="uint8")
    upper2 = np.array(HSV_UPPER_2, dtype="uint8")

    def gen_frames_pi():
        # display video
        for frame in camera.capture_continuous(raw_capture, format="bgr", use_video_port=True):
            img = frame.array
            img_contour = cv2.cvtColor(img.copy(), cv2.COLOR_BGR2HSV)
            img_rect = img.copy()

            mask1 = cv2.bitwise_not(cv2.inRange(img_contour, lower1, upper1))
            mask2 = cv2.bitwise_not(cv2.inRange(img_contour, lower2, upper2))
            full_mask = mask1 + mask2

            img_contour = cv2.bitwise_and(
                img_contour, img_contour, mask=full_mask)

            # get contour
            contours = cv2.findContours(
                filter_img(img_contour), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)  # change to CHAIN_APPROX_NONE if necessary
            contours = contours[0] if len(contours) == 2 else contours[1]

            for cnt in contours:
                area = cv2.contourArea(cnt)
                print("area: " + str(area))

                if area > CONTOUR_MIN_AREA:  # draw contour if area bigger than certain threshold
                    cv2.drawContours(img_contour, cnt, -1,
                                     CONTOUR_COLOR, CONTOUR_THICKNESS)
                    draw_rect(img_rect, cnt)

                    (raw_cx, raw_cy) = get_centroid(cnt)
                    print("raw cx: " + str(raw_cx) +
                          "; raw cy: " + str(raw_cy))

                    (cx, cy) = map_coordinate(raw_cx, raw_cy)
                    print("cx: " + str(cx) + "; cy: " + str(cy))

                    drive(cx, cy)

            success, buffer = cv2.imencode('.jpg', img_rect)

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

            # truncate and clear stream for next iteration
            raw_capture.truncate(0)

    # vid = cv2.VideoCapture(0)
    # cv2.namedWindow('frame')

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
        # return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')
        return Response(gen_frames_pi(), mimetype='multipart/x-mixed-replace; boundary=frame')

    if __name__ == "__main__":
        app.run(debug=False, port=3000, host="0.0.0.0")
