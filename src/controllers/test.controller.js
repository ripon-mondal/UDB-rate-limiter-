
export const testController = (req, res) => {

    return res.status(200).json({
        success: true,
        message: "Request successful! Rate limit not exceeded.",
        timestamp: new Date().toISOString()
    });

};
