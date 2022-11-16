const express = require('express');
// const { init } = require('raspi');
// const { SoftPWM } = require('raspi-soft-pwm');



const app = express();
const port = 3030;

app.use(express.static('public'))
app.use(express.json());

app.post('/drive', (req, res) => {
    console.log(req.body);
    res.send(200);
})

app.listen(port, () => {
    console.log(`Capy listening on port ${port}`)
});