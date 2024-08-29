const puppeteer = require('puppeteer-core');
const chromium = require('chrome-aws-lambda');

(async () => {
    let browser = null;

    try {
        // Launch the browser
        browser = await puppeteer.launch({
            args: chromium.args,
            defaultViewport: chromium.defaultViewport,
            executablePath: await chromium.executablePath,
            headless: true // Set to true to run in headless mode
        });

        const page = await browser.newPage();

        // Go to the initial URL
        await page.goto('https://www.druryhotels.com/bookandstay/newreservation/0066?bookItFastArrivalDate=2024-09-04&bookItFastDepartureDate=2024-09-05', { waitUntil: 'networkidle2', timeout: 0 });

        // Click on the button with the class 'btn btn-primary search-hotels-button'
        await page.click('.btn.btn-primary.search-hotels-button');

        // Wait for navigation to complete after clicking
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

        // Wait for the "choose-rate-and-room-card" elements to load
        const chooseRateAndRoomSelector = '.choose-rate-and-room-card';
        await page.waitForSelector(chooseRateAndRoomSelector, { timeout: 30000 });

        // Extract room details
        const roomDetails = await page.evaluate(() => {
            const roomCards = document.querySelectorAll('.choose-rate-and-room-card');
            if (roomCards.length === 0) {
                throw new Error("No rooms are available");
            }

            const rooms = [];
            roomCards.forEach(card => {
                const roomName = card.querySelector('.choose-rate-and-room-card__title.px-4')?.innerText || 'N/A';
                const cashValue = card.querySelector('.rate-choices-dual-rate-display.font-effra-medium.line-height-100.mt-2')?.innerText || 'N/A';

                rooms.push({
                    roomName,
                    cashValue
                });
            });

            return rooms;
        });

        console.log(roomDetails);
    } catch (error) {
        console.error("Error: " + error.message);
    } finally {
        // Close the browser
        if (browser) {
            await browser.close();
        }
    }
})();
