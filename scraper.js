const puppeteer = require('puppeteer');

(async () => {
    // Launch the browser
    const browser = await puppeteer.launch({ headless: false });
    const page = await browser.newPage();

    function getFormattedDate(date) {
        let day = date.getDate();
        return day < 10 ? '0' + day : day;
    }

    let today = new Date();
    let tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);

    // Format dates as 'DD'
    let qCiD = getFormattedDate(today);
    let qCoD = getFormattedDate(tomorrow);

    // Original URL
    let url = "https://www.ihg.com/holidayinn/hotels/us/en/find-hotels/select-roomrate?qDest=Holiday%20Inn%20University%20Plaza-Bowling%20Green&qPt=CASH&qCiD=28&qCoD=29&qCiMy=082024&qCoMy=082024&qAdlt=1&qChld=0&qRms=1&qAAR=6CBARC&qSlH=BWGWT&qAkamaiCC=IN&srb_u=1&qExpndSrch=false&qSrt=sBR&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.ki.ma.sp.va.sp.re.vx.nd.sx.we.lx.rn.sn.sn.sn.sn.sn.nu&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=false&qpMbw=0&qErm=false&qpMn=0&qLoSe=false&qChAge=&qRmFltr=";

    // Create a URL object
    let urlObj = new URL(url);

    // Set the new query parameters
    urlObj.searchParams.set('qCiD', qCiD);
    urlObj.searchParams.set('qCoD', qCoD);

    // Get the updated URL
    let updatedUrl = urlObj.toString();

    await page.goto(updatedUrl, { waitUntil: 'networkidle2', timeout: 0 });

    // Increase the timeout for waiting for the selector
    try {
        await page.waitForSelector('.roomName', { timeout: 30000 }); // 30 seconds timeout

        // Extract room details and cash values
        const roomDetails = await page.evaluate(() => {
            const rooms = [];
            const roomElements = document.querySelectorAll('.roomInfoPrice');
            console.log(roomElements)
            roomElements.forEach((roomElement) => {
                const roomName = roomElement.querySelector('.roomName').innerText;
                const cashValue = roomElement.querySelector('.cash').innerText;
                if(roomName == "1 King Standard" || roomName == "2 Queen Standard"){

                    rooms.push({
                        roomName,
                        cashValue: cashValue || 'N/A'
                    });
                }
            });

            return rooms;
            
        });
        console.log(roomDetails);
    } catch (error) {
        console.error("Error: "+error);
    }

    // Close the browser
    await browser.close();
})();
