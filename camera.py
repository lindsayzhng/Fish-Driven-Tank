from flask import Flask, render_template, Response

from picamera.array import PiRGBArray
from picamera import PiCamera

import cv2
import numpy as np
import requests

from constants import *


app = Flask(__name__)

with PiCamera() as camera:
    camera.resolution = (FRAME_WIDTH, FRAME_HEIGHT)
    camera.framerate = FRAMERATE
    camera.brightness = BRIGHTNESS

    raw_capture = PiRGBArray(camera, size=(FRAME_WIDTH, FRAME_HEIGHT))

    def filter_img(img):
        img_blur = cv2.GaussianBlur(img, GAUSSIAN_KERNEL, GAUSSIAN_SIGMA)
        img_canny = cv2.Canny(img_blur, CANNY_LOWER_THRESHOLD,
                              CANNY_UPPER_THRESHOLD)
        # order of dilation and erosion can be changed
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
        cv2.drawContours(img, [box], 0, DRAW_COLOR, DRAW_THICKNESS)

    def get_centroid(cnt):
        M = cv2.moments(cnt)
        cx = int(M['m10']/M['m00'])
        cy = int(M['m01']/M['m00'])
        return (cx, cy)

    def map_coordinate(cx, cy):
        dx = -(cx - OFFSET[0]) / KIMCHI_RADIUS
        dy = (cy - OFFSET[1]) / KIMCHI_RADIUS
        return (dx, dy)

    def drive(raw_x, raw_y, caller='Fish', drive_mode='curvature'):
        data = {'rawX': raw_x, 'rawY': raw_y, 'caller': caller,
                'driveMode': drive_mode}
        requests.post('http://localhost:3030/drive', json=data)

    def gen_frames_pi():
        lower = np.array(BGR_LOWER, dtype="uint8")
        upper = np.array(BGR_UPPER, dtype="uint8")

        for frame in camera.capture_continuous(raw_capture, format="bgr", use_video_port=True):
            img = frame.array
            img_contour = img.copy()
            img_rect = img.copy()

            cv2.circle(img_rect, OFFSET, KIMCHI_RADIUS,
                       DRAW_COLOR, DRAW_THICKNESS)

            mask = cv2.bitwise_not(cv2.inRange(img_contour, lower, upper))
            img_contour = cv2.bitwise_and(img_contour, img_contour, mask=mask)

            # get contour
            contours = cv2.findContours(
                filter_img(img_contour), cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contours = contours[0] if len(contours) == 2 else contours[1]

            for cnt in contours:
                area = cv2.contourArea(cnt)

                if CONTOUR_MIN_AREA < area < CONTOUR_MAX_AREA:  # draw contour if area within range
                    cv2.drawContours(img_contour, cnt, -1,
                                     DRAW_COLOR, DRAW_THICKNESS)
                    draw_rect(img_rect, cnt)

                    (raw_cx, raw_cy) = get_centroid(cnt)
                    (cx, cy) = map_coordinate(raw_cx, raw_cy)

                    cv2.line(img_rect, OFFSET, (raw_cx, raw_cy),
                             DRAW_COLOR, DRAW_THICKNESS)
                    cv2.putText(img_rect, "{:.2f}".format(cx)+', '+"{:.2f}".format(cy),
                                (50, 50), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), DRAW_THICKNESS)
                    cv2.putText(img_rect, "{:.2f}".format(area),
                                (50, 80), cv2.FONT_HERSHEY_SIMPLEX, 1, (255, 255, 255), DRAW_THICKNESS)
                    drive(cx, cy)

            success, buffer = cv2.imencode('.jpg', (img_rect))

            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')

            # truncate and clear stream for next iteration
            raw_capture.truncate(0)

    @app.route('/video_feed')
    def video_feed():
        return Response(gen_frames_pi(), mimetype='multipart/x-mixed-replace; boundary=frame')

    if __name__ == "__main__":
        app.run(debug=False, port=3000, host="0.0.0.0")
