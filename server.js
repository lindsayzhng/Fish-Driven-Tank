const express = require('express');
const constants = require('./constants');

const app = express();
const port = 3030;

app.use(express.static('public'))
app.use(express.json());

let ignoreFish = true;

try {
    const { SoftPWM } = require('raspi-soft-pwm');
    const { init } = require('raspi');

    init(() => {
        const rightMotorForward = new SoftPWM(constants.Motors.RIGHT_FORWARD);
        const rightMotorBackward = new SoftPWM(constants.Motors.RIGHT_BACKWARD);
        const leftMotorForward = new SoftPWM(constants.Motors.LEFT_FORWARD);
        const leftMotorBackward = new SoftPWM(constants.Motors.LEFT_BACKWARD);

        const driveModes = {
            arcade: arcadeDrive,
            curvature: curvatureDrive
        };

        app.post('/ignoreFish', (req, res) => {
            const { ignore } = req.body;
            ignoreFish = ignore;
            res.send(200);
        })

        app.post('/drive', (req, res) => {
            const { rawX, rawY, caller, driveMode } = { ...constants.DefaultInput, ...req.body };
            console.log(req.body);

            if (caller === 'Fish' && ignoreFish) {
                res.send(200);
                return;
            }

            driveModes[driveMode](rawX, rawY, caller);

            res.send(200);
        })

        /**
         * Ignore input values if it is within a specified range around zero. 
         * 
         * @param {number} value input
         * @param {Object} caller caller of input
         * @param {number} maxMagnitude maximum magnitude of input
         * @returns value after deadband applied
         */
        function applyDeadband(value, caller, maxMagnitude = 1) { // TODO: change max magnitude value
            const deadband = caller.INPUT_DEADBAND;
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
        }

        /**
         * Get value clamped between a high and low boundary, used when boundary set have different signs.
         * 
         * @param {number} value value needs to be clamped
         * @param {Object} caller caller of input
         * @return clamped value
         */
        function clamp(value, caller) {
            return Math.max(caller.MIN_INPUT, Math.min(value, caller.MAX_INPUT));
        }

        /**
         * Amplify input values.
         * 
         * @param {number} value input
         * @param {Object} caller caller of input
         * @returns magnified input
         */
        function magnifyInputs(value, caller) {
            return Math.sign(value) * (Math.abs(value) ** caller.MAGNIFY_DEGREE);
        }

        /**
         * Filter raw input values based on caller.
         * 
         * @param {Array} rawInput raw input (x, y)
         * @param {Array} fArr array of functions to filter raw
         * @param {String} caller caller of the driver
         * @returns 
         */
        function filterRaw(rawInput, fArr, caller) {
            return rawInput.map(n => fArr.reduce((curr, f) => f(curr, constants[caller]), n));
        }

        /**
         * Desaturate.
         * 
         * @param {Array} speed speed output to the motor
         * @param {Array} raw speed and rotation 
         * @param {String} driveMode curvature or arcade
         * @returns desaturated speed
         */
        function desaturate([leftSpeed, rightSpeed], [speed, rotation], driveMode) {

            const max = Math.max(Math.abs(speed), Math.abs(rotation));

            if (!max) return [0, 0];

            switch (driveMode) {
                case 'arcade':
                    const min = Math.min(Math.abs(speed), Math.abs(rotation));
                    const saturatedInput = (max + min) / max;
                    return [leftSpeed / saturatedInput, rightSpeed / saturatedInput];
                case 'curvature':
                    return max > 1 ? [leftSpeed / max, rightSpeed / max] : [leftSpeed, rightSpeed];
            }
        }

        /**
         * Remap number to certain range.
         * 
         * @param {number} value value that needs to be remapped
         * @param {number} inMin input range minimum
         * @param {number} inMax input range maximum
         * @param {number} outMin output range minimum
         * @param {number} outMax output range maximum
         * @returns remapped value
         */
        function mapRange(value, inMin, inMax, outMin, outMax) {
            console.log({ value, inMin, inMax, outMin, outMax })
            return (value - inMin) * (outMax - outMin) / (inMax - inMin) + outMin;
        }

        /**
         * Set left and right motor speeds to the GPIO pins.
         * 
         * @param {number} leftSpeed 
         * @param {number} rightSpeed 
         */
        function setMotors(leftSpeed, rightSpeed, caller = 'Joystick') {
            console.log({ caller })
            leftSpeed = mapRange(leftSpeed, constants[caller].MIN_INPUT, constants[caller].MAX_INPUT, -constants.Motors.MAX_INPUT, constants.Motors.MAX_INPUT);
            rightSpeed = mapRange(rightSpeed, constants[caller].MIN_INPUT, constants[caller].MAX_INPUT, -constants.Motors.MAX_INPUT, constants.Motors.MAX_INPUT);

            console.log([leftSpeed, rightSpeed]);

            leftMotorForward.write(leftSpeed > 0 ? leftSpeed : 0);
            leftMotorBackward.write(leftSpeed < 0 ? -leftSpeed : 0);
            rightMotorForward.write(rightSpeed > 0 ? rightSpeed : 0);
            rightMotorBackward.write(rightSpeed < 0 ? -rightSpeed : 0);
        }

        /**
         * Stop motors.
         */
        function lockWheels() {
            setMotors(0, 0);
        }

        /**
         * Arcade drive of the robot.
         * 
         * @param {number} rawX raw x input
         * @param {number} rawY raw y input
         */
        function arcadeDrive(rawX, rawY, caller) {

            const [rotation, speed] = filterRaw([rawX, rawY], [applyDeadband, clamp, magnifyInputs], caller);
            const [leftSpeed, rightSpeed] = desaturate([speed + rotation, speed - rotation], [speed, rotation], 'arcade');

            setMotors(leftSpeed, rightSpeed, caller);
        }

        /**
         * Curvature drive of the robot.
         * 
         * @param {number} rawX raw x input
         * @param {number} rawY raw y input
         */
        function curvatureDrive(rawX, rawY, caller) {

            const [rotation, speed] = filterRaw([rawX, rawY], [applyDeadband, clamp, magnifyInputs], caller)
            const [leftSpeed, rightSpeed] = desaturate([speed + rotation, speed - rotation], [speed, rotation], 'curvature');

            setMotors(leftSpeed, rightSpeed, caller);
        }
    });
} catch (e) {

}

app.listen(port, () => {
    console.log(`Capy listening on port ${port}`)
});
