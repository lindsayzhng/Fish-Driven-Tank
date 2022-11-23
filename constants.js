// change file to type module in html
module.exports = {
    Motors: {
        RIGHT_FORWARD: 'GPIO18',
        RIGHT_BACKWARD: 'GPIO19',
        LEFT_FORWARD: 'GPIO13',
        LEFT_BACKWARD: 'GPIO12',

        MAX_VOLTAGE: 0.3, // max power: 30%
    },
    Raw: { // up to change
        MAX_INPUT: 1,
        MIN_INPUT: -1,
        INPUT_DEADBAND: 0.05,
        MAGNIFY_DEGREE: 3,
    }
}
