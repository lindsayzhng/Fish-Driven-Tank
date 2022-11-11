function alertUser() {}
function shoot() {
  //shoots
}
function moveH() {
  //moves horizontally
}
function turn(dir) {
  if (dir === 0) {
    drive(0, 0, 0, 0);
  } else if (dir > 0) {
    drive(dir, 0, 0, dir);
  } else {
    drive(0, -dir, -dir, 0);
  }
}
function moveV(power) {
  //moves vertically
  if (power === 0) {
    drive(0, 0, 0, 0);
  } else if (power > 0) {
    drive(power, power, 0, 0);
  } else {
    drive(0, 0, -power, -power);
  }
}

function drive(lf, rf, lb, rb) {
  fetch("/drive", {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ rf, lf, rb, lb }),
  });
}
