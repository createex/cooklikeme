const config = require('../config/config');

// Get Stripe Keys from ENV
const getStripeKeys = async (req, res) => {
    try {
        const secretKey = config.SECRET_KEY;
        const publishableKey = config.PUBLISHABLE_KEY;

        if (!secretKey || !publishableKey) {
            return res.status(500).json({
                success: false,
                message: "Stripe keys are not configured properly in the environment variables.",
            });
        }

        return res.status(200).json({
            success: true,
            message: "Stripe keys recieved Successfully",
            data: {
                secretKey,       // Only include if you intend to return it; otherwise, omit for security.
                publishableKey,
            },
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: "An error occurred while retrieving the Stripe keys.",
            error: error.message,
        });
    }
};

module.exports = { getStripeKeys };
