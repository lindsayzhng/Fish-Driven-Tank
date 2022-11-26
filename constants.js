const Motors = {
    RIGHT_FORWARD: 'GPIO18',
    RIGHT_BACKWARD: 'GPIO19',
    LEFT_FORWARD: 'GPIO13',
    LEFT_BACKWARD: 'GPIO12',

    MAX_VOLTAGE: 0.3, // max power: 30%
};

const Joystick = {
    MAX_INPUT: 1,
    MIN_INPUT: -1,
    INPUT_DEADBAND: 0.05,
    MAGNIFY_DEGREE: 3,
}

const Fish = {
    MAX_INPUT: 1,
    MIN_INPUT: -1,
    INPUT_DEADBAND: 0.05,
    MAGNIFY_DEGREE: 3,
}

module.exports = {
    Motors,
    Joystick,
    Fish
}
