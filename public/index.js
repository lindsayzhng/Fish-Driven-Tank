function handleLock(el) {
  ignoreFish(el.checked);
}

var joy = new JoyStick('joyDiv', {}, function (stickData) {
  stickData.x /= 100;
  stickData.y /= 100;
  drive(stickData.x, stickData.y);
});

function ignoreFish(ignore) {
  fetch("/ignoreFish", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ ignore }),
  });
}

function drive(rawX, rawY, caller = 'Joystick', driveMode = 'curvature') {
  fetch("/drive", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawX, rawY, caller, driveMode, }),
  });
}
