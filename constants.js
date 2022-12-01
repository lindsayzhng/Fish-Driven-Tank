const Motors = {
    RIGHT_FORWARD: 'GPIO18',
    RIGHT_BACKWARD: 'GPIO19',
    LEFT_FORWARD: 'GPIO13',
    LEFT_BACKWARD: 'GPIO12',

    MAX_INPUT: 0.15,
    MIN_INPUT: 0.0025
};

const DefaultInput = {
    rawX: 0,
    rawY: 0,
    caller: 'Joystick',
    driveMode: 'curvature',
}

const Joystick = {
    MAX_INPUT: 1,
    MIN_INPUT: -1,
    INPUT_DEADBAND: 0.01,
    MAGNIFY_DEGREE: 1,
}

const Fish = {
    MAX_INPUT: 1,
    MIN_INPUT: -1,
    INPUT_DEADBAND: 0.01,
    MAGNIFY_DEGREE: 1,
}

module.exports = {
    Motors,
    DefaultInput,
    Joystick,
    Fish
}
