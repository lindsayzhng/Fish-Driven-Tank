const express = require('express');
const { SoftPWM } = require('raspi-soft-pwm');
const { init } = require('raspi');
const constants = require('./constants');

init(() => {

    const app = express();
    const port = 3030;

    const rightMotorForward = new SoftPWM(constants.Motors.RIGHT_FORWARD);
    const rightMotorBackward = new SoftPWM(constants.Motors.RIGHT_BACKWARD);
    const leftMotorForward = new SoftPWM(constants.Motors.LEFT_FORWARD);
    const leftMotorBackward = new SoftPWM(constants.Motors.LEFT_BACKWARD);

    app.use(express.static('public'))
    app.use(express.json());

    app.post('/drive', (req, res) => {

        // const { rf, rb, lf, lb } = req.body;

        // rightMotorForward.write(rf ?? 0);
        // rightMotorBackward.write(rb ?? 0);
        // leftMotorForward.write(lf ?? 0)
        // leftMotorBackward.write(lb ?? 0);

        const { rawX, rawY } = req.body;
        console.log(req.body);

        arcadeDrive(rawX, rawY);

        res.send(200);
    })

    app.listen(port, () => {
        console.log(`Capy listening on port ${port}`)
    });

    function normalize() { }; // if read from motors

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
     * Amplify input values.
     * 
     * @param {number} value input
     * @param {number} mult degree of amplification
     * @returns 
     */
    function magnifyInput(value, mult = constants.Raw.MAGNIFY_MULT) { // TODO: change how the input is amplified
        return Math.sign(value) * value * mult;
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
     * Emergency stop motors.
     */
    function stopMotors() {
        setMotors(0, 0);
    };

    function arcadeDrive(rawX, rawY) {
        speed = applyDeadband(rawX);
        rotation = applyDeadband(rawY);

        // inverse kinematics for differential drive

        setMotors();

    };

    function curvatureDrive(rawX, rawY) { };
});
