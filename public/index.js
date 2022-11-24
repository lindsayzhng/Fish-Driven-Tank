lock = false;
const el = document.getElementById("switch");
el.addEventListener("click", function () {
  if (lock == false) {
    lock = true;
    drive(0, 0, true, 'Joystick');
    console.log('lock');
  }
  else {
    lock = false;
    drive(0, 0, false, 'Joystick');
    console.log('unlock');
  }
})

function drive(rawX, rawY, lock) {
  if (lock == false) {
    fetch("/drive", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ rawX, rawY }),
    });
  }
  else {
    fetch("/drive", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      rawX: 0,
      rawY: 0,
      body: JSON.stringify({ rawX, rawY }),
    });
  }
}

var joy = new JoyStick('joyDiv', {}, function (stickData) {
  stickData.x /= 100;
  stickData.y /= 100;
  drive(stickData.x, stickData.y, 'Joystick');
});