const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 3000;

app.get('/Holiday-Inn-University-Plaza-Bowling-Green', async (req, res) => {
    
    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    try {
        // Create a URL object
        let url = "https://www.ihg.com/holidayinn/hotels/us/en/find-hotels/select-roomrate?qDest=Holiday%20Inn%20University%20Plaza-Bowling%20Green&qPt=CASH&qCiD=28&qCoD=29&qCiMy=082024&qCoMy=082024&qAdlt=1&qChld=0&qRms=1&qAAR=6CBARC&qSlH=BWGWT&qAkamaiCC=IN&srb_u=1&qExpndSrch=false&qSrt=sBR&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.ki.ma.sp.va.sp.re.vx.nd.sx.we.lx.rn.sn.sn.sn.sn.sn.nu&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=false&qpMbw=0&qErm=false&qpMn=0&qLoSe=false&qChAge=&qRmFltr=";
        let urlObj = new URL(url);

        // Set the new query parameters
        urlObj.searchParams.set('qCiD', checkinDate.substring(0, 2));
        urlObj.searchParams.set('qCiMy', checkinDate.substring(2));
        urlObj.searchParams.set('qCoD', checkoutDate.substring(0, 2));
        urlObj.searchParams.set('qCoMy', checkoutDate.substring(2));

        // Get the updated URL
        let updatedUrl = urlObj.toString();

        await page.goto(updatedUrl, { waitUntil: 'networkidle2', timeout: 0 });

        // Increase the timeout for waiting for the selector
        await page.waitForSelector('.roomName', { timeout: 30000 }); // 30 seconds timeout

        // Extract room details and cash values
        const roomDetails = await page.evaluate(() => {
            const rooms = [];
            const roomElements = document.querySelectorAll('.roomInfoPrice');
            roomElements.forEach((roomElement) => {
                const roomName = roomElement.querySelector('.roomName').innerText;
                const cashValue = roomElement.querySelector('.cash').innerText;
                if (roomName === "1 King Standard" || roomName === "2 Queen Standard") {
                    rooms.push({
                        roomName,
                        cashValue: cashValue || 'N/A'
                    });
                }
            });
            return rooms;
        });

        res.json(roomDetails);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('An error occurred');
    } finally {
        await browser.close();
    }
});

// Increase the timeout for the API response
app.use((req, res, next) => {
    res.setTimeout(120000, () => { // 2 minutes timeout
        res.status(408).send('Request has timed out');
    });
    next();
});

app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});
