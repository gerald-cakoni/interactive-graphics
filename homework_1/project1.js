// bgImg is the background image to be modified.
// fgImg is the foreground image.
// fgOpac is the opacity of the foreground image.
// fgPos is the position of the foreground image in pixels. It can be negative and (0,0) means the top-left pixels of the foreground and background are aligned.
function composite(bgImg, fgImg, fgOpac, fgPos) {
    let bgData = bgImg.data;
    let fgData = fgImg.data;
    let bgWidth = bgImg.width;
    let bgHeight = bgImg.height;
    let fgWidth = fgImg.width;
    let fgHeight = fgImg.height;

    for (let y = 0; y < fgHeight; y++) {
        for (let x = 0; x < fgWidth; x++) {
            let bgX = fgPos.x + x;
            let bgY = fgPos.y + y;

            // Check if the pixel is within the bounds of the background image
            if (bgX < 0 || bgX >= bgWidth || bgY < 0 || bgY >= bgHeight) {
                continue;
            }

            let fgIndex = (y * fgWidth + x) * 4;
            let bgIndex = (bgY * bgWidth + bgX) * 4;

            let fgR = fgData[fgIndex];
            let fgG = fgData[fgIndex + 1];
            let fgB = fgData[fgIndex + 2];
            let fgA = (fgData[fgIndex + 3] / 255) * fgOpac; // Scale alpha by fgOpac

            let bgR = bgData[bgIndex];
            let bgG = bgData[bgIndex + 1];
            let bgB = bgData[bgIndex + 2];
            let bgA = bgData[bgIndex + 3] / 255;

            // Alpha blending formula
            let outA = fgA + bgA * (1 - fgA);
            if (outA > 0) {
                bgData[bgIndex] = (fgR * fgA + bgR * bgA * (1 - fgA)) / outA;
                bgData[bgIndex + 1] = (fgG * fgA + bgG * bgA * (1 - fgA)) / outA;
                bgData[bgIndex + 2] = (fgB * fgA + bgB * bgA * (1 - fgA)) / outA;
                bgData[bgIndex + 3] = outA * 255;
            }
        }
    }
}
