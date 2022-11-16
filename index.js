const express = require('express');
const { init } = require('raspi');
const { SoftPWM } = require('raspi-soft-pwm');


init(() => {
    const rightMotorForward = new SoftPWM('GPIO18');
    const rightMotorBackward = new SoftPWM('GPIO19');
    const leftMotorForward = new SoftPWM('GPIO13');
    const leftMotorBackward = new SoftPWM('GPIO12');

    const app = express();
    const port = 3030;

    app.use(express.static('public'))
    app.use(express.json());

    app.post('/drive', (req, res) => {
        const { rf, rb, lf, lb } = req.body;

        rightMotorForward.write(rf ?? 0);
        rightMotorBackward.write(rb ?? 0);
        leftMotorForward.write(lf ?? 0)
        leftMotorBackward.write(lb ?? 0);

        res.send(200);

    })

    app.listen(port, () => {
        console.log(`Capy listening on port ${port}`)
    });
});


