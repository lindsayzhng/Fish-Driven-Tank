const express = require('express');
const constants = require('./constants');

const app = express();
const port = 3030;

app.use(express.static('public'))
app.use(express.json());

try {
    const { SoftPWM } = require('raspi-soft-pwm');
    const { init } = require('raspi');

    // const videoStream = require('raspberrypi-node-camera-web-streamer');
    // videoStream.acceptConnections(app, {
    //   width: 1280,
    //   height: 720,
    //   fps: 16,
    //   encoding: 'JPEG',
    //   quality: 7 //lower is faster
    // }, '/stream.mjpg', true);
    init(() => {
        const rightMotorForward = new SoftPWM(constants.Motors.RIGHT_FORWARD);
        const rightMotorBackward = new SoftPWM(constants.Motors.RIGHT_BACKWARD);
        const leftMotorForward = new SoftPWM(constants.Motors.LEFT_FORWARD);
        const leftMotorBackward = new SoftPWM(constants.Motors.LEFT_BACKWARD);

        app.post('/drive', (req, res) => {
            const { rawX, rawY, lock, caller } = req.body;
            console.log(req.body);

            const driveMode = 'arcade';

            if (lock) lockWheels();

            switch (caller) {
                case 'Joystick':
                    // import
                    break;
                case 'Fish':
                    // import
                    break;
            }

            switch (driveMode) {
                case 'arcade':
                    arcadeDrive(rawX, rawY);
                    break;
                case 'curvature':
                    curvatureDrive(rawX, rawY, true);
                    break;
            }

            res.send(200);
        })

        /**
         * Ignore input values if it is within a specified range around zero. 
         * 
         * @param {number} value input
         * @param {number} deadband specified range around zero
         * @param {number} maxMagnitude maximum magnitude of input
         * @returns value after deadband applied
         */
        function applyDeadband(value, deadband = constants.Raw.INPUT_DEADBAND, maxMagnitude = 1) { // TODO: change max magnitude value
            if (Math.abs(value) < deadband) return 0;

            // Map deadband to 0 and map max to max.

            // y - y₁ = m(x - x₁)
            // y - y₁ = (y₂ - y₁)/(x₂ - x₁) (x - x₁)
            // y = (y₂ - y₁)/(x₂ - x₁) (x - x₁) + y₁
            // (x₁, y₁) = (deadband, 0) and (x₂, y₂) = (max, max).
            //
            // y = (max - 0)/(max - deadband) (x - deadband) + 0
            // y = max/(max - deadband) (x - deadband)
            // y = max (x - deadband)/(max - deadband)

            return value > 0 ? maxMagnitude * (value - deadband) / (maxMagnitude - deadband)
                : maxMagnitude * (value + deadband) / (maxMagnitude - deadband);
        };

        /**
         * Get value clamped between a high and low boundary.
         * 
         * @param {number} value value needs to be clamped
         * @param {number} low low boundary
         * @param {number} high high boundary
         * @returns clamped value
         */
        function clamp(value, low = constants.Raw.MIN_INPUT, high = constants.Raw.MAX_INPUT) {
            return Math.max(low, Math.min(value, high));
        }

        /**
         * Amplify input values.
         * 
         * @param {number} value input
         * @param {number} magnitude degree of amplification
         * @returns 
         */
        function magnifyInputs(value, magnitude = constants.Raw.MAGNIFY_DEGREE) {
            return Math.sign(value) * Math.abs(value ** magnitude);
        }

        /**
         * 
         * @param {*} param0 
         * @param {*} param1 
         * @returns 
         */
        function desaturate([leftSpeed, rightSpeed], [speed, rotation], driveMode) {

            const max = Math.max(Math.abs(speed), Math.abs(rotation));

            switch (driveMode) {
                case 'arcade':
                    const min = Math.min(Math.abs(speed), Math.abs(rotation));

                    if (!max) return [0, 0];
                    const saturatedInput = (max + min) / max;
                    return [leftSpeed / saturatedInput, rightSpeed / saturatedInput];
                case 'curvature':
                    return max > 1 ? [leftSpeed / max, rightSpeed / max] : [leftSpeed, rightSpeed];
            }
        }

        /**
         * Set left and right motor speeds to the GPIO pins.
         * 
         * @param {number} leftSpeed 
         * @param {number} rightSpeed 
         */
        function setMotors(leftSpeed, rightSpeed) {
            leftMotorForward.write(leftSpeed > 0 ? leftSpeed : 0)
            leftMotorBackward.write(leftSpeed < 0 ? -leftSpeed : 0);
            rightMotorForward.write(rightSpeed > 0 ? rightSpeed : 0);
            rightMotorBackward.write(rightSpeed < 0 ? -rightSpeed : 0);
        }

        /**
         * Stop motors.
         */
        function lockWheels() {
            setMotors(0, 0);
        };

        /**
         * Arcade drive of the robot.
         * 
         * @param {number} rawX raw x input
         * @param {number} rawY raw y input
         */
        function arcadeDrive(rawX, rawY) {

            const [rotation, speed] = [rawX, rawY].map(x => applyDeadband(x)).map(x => clamp(x)).map(x => magnifyInputs(x));
            // console.log({ rotation, speed });
            const [leftSpeed, rightSpeed] = desaturate([speed + rotation, speed - rotation], [speed, rotation], 'arcade');

            // console.log("Motors: ", leftSpeed, rightSpeed);
            setMotors(leftSpeed, rightSpeed);
        };

        /**
         * Curvature drive of the robot.
         * 
         * @param {number} rawX raw x input
         * @param {number} rawY raw y input
         */
        function curvatureDrive(rawX, rawY, allowTurnInPlace = true) {

            const [speed, rotation] = [rawX, rawY].map(x => applyDeadband(x)).map(x => clamp(x)).map(x => magnifyInputs(x));
            const [leftSpeed, rightSpeed] = desaturate(
                [speed - allowTurnInPlace ? rotation : Math.abs(speed) * rotation,
                speed + allowTurnInPlace ? rotation : Math.abs(speed) * rotation],
                [speed, rotation], 'curvature');

            setMotors(leftSpeed, rightSpeed);
        };
    });
} catch (e) {

}

app.listen(port, () => {
    console.log(`Capy listening on port ${port}`)
});