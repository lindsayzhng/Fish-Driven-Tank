let lock = true;

function handleLock(el) {
  lock = el.checked;
  console.log(lock);
}

var joy = new JoyStick('joyDiv', {}, function (stickData) {
  stickData.x /= 100;
  stickData.y /= 100;
  drive(stickData.x, stickData.y, lock, 'Joystick');
});

function drive(rawX, rawY, lock, caller) {
  fetch("/drive", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rawX, rawY, lock, caller }),
  });
}
