from flask import Flask, render_template, Response
import cv2
import numpy as np

app = Flask(__name__)

lower = np.array([90,130,170], dtype = "uint8") 

upper= np.array([190,220,250], dtype = "uint8")

vid = cv2.VideoCapture(0)
cv2.namedWindow('frame')

'''
for ip camera use - rtsp://username:password@ip_address:554/user=username_password='password'_channel=channel_number_stream=0.sdp' 
for local webcam use cv2.VideoCapture(0)
'''

def gen_frames():
        success, frame = vid.read()
        
        if not success:
            return
        else:
            ret, buffer = cv2.imencode('.jpg', frame)
            frame = buffer.tobytes()
            
            mask = cv2.inRange(frame, lower, upper)
            output = cv2.bitwise_and(frame, frame, mask = mask)

            gray = cv2.cvtColor(output, cv2.COLOR_BGR2GRAY)

            thresh = cv2.threshold(gray, 128, 255, cv2.THRESH_BINARY)[1]

            contours = cv2.findContours(
            thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            contours = contours[0] if len(contours) == 2 else contours[1]
            
            for cntr in contours:
                x, y, w, h = cv2.boundingRect(cntr)
                if not(w<475 and w>300 and h<150 and h>75):
                    continue

                cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 0, 255), 2)

                centerx = (x+(w/2))
                centery = (y+(h/2))
                font = cv2.FONT_HERSHEY_SIMPLEX
                cv2.putText(frame, str(centerx)+', '+str(centery),(x,y), font, 1, (255, 0,0),2)
            
            return (b'--frame\r\n'
                    b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')  
        #cv2.imshow('frame', np.hstack([frame, output]))
        
        

        #if (cv2.waitKey(1) == ord('x')):
            #break

@app.route('/video_feed')
def video_feed():
    return Response(gen_frames(), mimetype='multipart/x-mixed-replace; boundary=frame')

if __name__ == "__main__":
    app.run(debug=True)