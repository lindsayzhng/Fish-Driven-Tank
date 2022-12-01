# all constants need to be tuned
# max resolution for video - number of pixels (size of frame)
FRAME_WIDTH = 640
FRAME_HEIGHT = 480

FRAMERATE = 20
BRIGHTNESS = 50

# coordinate of center of tank in respect to coordinate of center of images
OFFSET = (285, 225)
KIMCHI_RADIUS = 120

# lower and upper hsv value for color filtering
BGR_LOWER = [0, 40, 0]
BGR_UPPER = [255, 255, 255]

# matrix of pixels - entries must be positive odd integer
GAUSSIAN_KERNEL = (5, 5)
GAUSSIAN_SIGMA = 1  # standard deviation r**2 - degree of significance of pixel in kernel

# connect lines based on context between lower and upper threshold
CANNY_LOWER_THRESHOLD = 128
CANNY_UPPER_THRESHOLD = 255  # edge detection at upper threshold

# matrix of pixels - entries must be positive odd integer
DILATE_KERNEL = (5, 5)
# matrix of pixels - entries must be positive odd integer
ERODE_KERNEL = (5, 5)

# area range for contour detection
CONTOUR_MIN_AREA = 500
CONTOUR_MAX_AREA = 3000

DRAW_COLOR = (0, 255, 0)
DRAW_THICKNESS = 2
