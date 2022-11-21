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

        const { rawX, rawY } = req.body;
        console.log(req.body);

        // process raw

        // write to motor

        res.send(200);
    })

    app.listen(port, () => {
        console.log(`Capy listening on port ${port}`)
    });
});

// implement arcade drive / curvature drive