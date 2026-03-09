const getAccessToken = () => localStorage.getItem("accessToken");
const getRefreshToken = () => localStorage.getItem("refreshToken");

const setTokens = (accessToken, refreshToken) => {
    localStorage.setItem("accessToken", accessToken);
    localStorage.setItem("refreshToken", refreshToken);
};

const setAccessToken = (accessToken) => {
    localStorage.setItem("accessToken", accessToken);
};

const clearTokens = () => {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
};

export default {
    getAccessToken,
    getRefreshToken,
    setTokens,
    setAccessToken,
    clearTokens,
};
