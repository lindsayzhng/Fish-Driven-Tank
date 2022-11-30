# all constants need to be tuned
# max resolution for video - number of pixels (size of frame)
FRAME_WIDTH = 640
FRAME_HEIGHT = 480

FRAMERATE = 20
BRIGHTNESS = 50

# coordinate of center of tank in respect to coordinate of center of image
X_OFFSET = 0
Y_OFFSET = 0

# lower and upper hsv value for color filtering
HSV_LOWER_1 = [0, 100, 20]
HSV_UPPER_1 = [10, 255, 255]

HSV_LOWER_2 = [160, 100, 20]
HSV_UPPER_2 = [179, 255, 255]

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

CONTOUR_COLOR = (0, 255, 0)
CONTOUR_THICKNESS = 2
CONTOUR_MIN_AREA = 250
