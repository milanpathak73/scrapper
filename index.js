const express = require('express');
const puppeteer = require('puppeteer');

const app = express();
const port = 8080;

// app.get('/Courtyard-Bowling-Green-Convention-Center', async (req, res) => {

//     const { checkinDate, checkoutDate } = req.query;

//     if (!checkinDate || !checkoutDate) {
//         return res.status(400).send('Please provide checkinDate and checkoutDate');
//     }

//     function formatDate(inputDate) {
//         // Ensure the input is in "YYYY-MM-DD" format
//         const [year, month, day] = inputDate.split('-');
    
//         // Format the date as "MM%2FDD%2FYYYY"
//         const formattedDate = `${month}%2F${day}%2F${year}`;
    
//         return formattedDate;
//     }

//     const NewcheckInDate = formatDate(checkinDate);
//     const NewcheckOutDate = formatDate(checkoutDate);

//     const browser = await puppeteer.launch({ headless: false });
//     const page = await browser.newPage();

//     const url = "https://www.marriott.com/reservation/availabilitySearch.mi?destinationAddress.country=&lengthOfStay=1&fromDate="+NewcheckInDate+"&toDate="+NewcheckOutDate+"&numberOfRooms=1&numberOfAdults=1&guestCountBox=1+Adults+Per+Room&childrenCountBox=0+Children+Per+Room&roomCountBox=1+Rooms&childrenCount=0&childrenAges=&clusterCode=none&corporateCode=&groupCode=&isHwsGroupSearch=true&propertyCode=BWGCY&useRewardsPoints=false&flexibleDateSearch=false&t-start="+NewcheckInDate+"&t-end="+NewcheckOutDate+"&fromDateDefaultFormat="+NewcheckInDate+"&toDateDefaultFormat="+NewcheckOutDate+"&fromToDate_submit="+NewcheckOutDate+"&fromToDate=";

//     try {
//         // Launch the browser

//         // Your URL and parameters

//         await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
//         await page.waitForSelector('ol.grid', { timeout: 50000 }); // 30 seconds timeout

//         // Extract <li> elements
//         const rooms = await page.evaluate(() => {
//             // Select the <ol> with the specific class
//             const olElement = document.querySelector('ol.grid');
//             if (!olElement) {
//                 return [];
//             }

//             // Extract <li> elements
//             const liElements = olElement.querySelectorAll('li');
//             const roomDetails = [];

//             liElements.forEach((li) => {
//                 const text = li.innerText.trim();

//                 // Regular expression to extract room name and cash value
//                 const match = text.match(/^([\d\w\s]+)\s*\n[\d\w\s]+\nRoom details >\nBook From \$(\d+)/);
                
//                 if (match) {
//                     const roomName = match[1].trim();
//                     const cashValue = match[2].trim();

//                     roomDetails.push({
//                         roomName,
//                         cashValue
//                     });
//                 }
//             });

//             return roomDetails;
//         });

//         await browser.close();

//         // Send the response
//         res.json(rooms);
//     } catch (error) {
//         console.error('Error:', error);
//         res.status(500).json({ error: "no rooms are available" });
//     }
// });


const MAX_RETRIES = 3;

async function scrapeRoomDetails(url, retries = 0) {
    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    try {
        // Navigate to the page
        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });

        // Click on the button with class "btn btn-primary search-hotels-button"
        await page.click('.btn.btn-primary.search-hotels-button');

        // Wait for the page to redirect and load
        await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 0 });

        // Scrape the room details
        const roomDetails = await page.evaluate(() => {
            const rooms = [];
            const roomElements = document.querySelectorAll('.choose-rate-and-room-card');
            
            if (roomElements.length === 0) {
                throw new Error("no rooms are available");
            }

            roomElements.forEach(roomElement => {
                const roomName = roomElement.querySelector('.choose-rate-and-room-card__title.px-4')?.innerText || 'N/A';
                const cashValue = roomElement.querySelector('.rate-choices-dual-rate-display.font-effra-medium.line-height-100.mt-2')?.innerText || 'N/A';
                rooms.push({
                    roomName,
                    cashValue,
                });
            });

            return rooms;
        });

        await browser.close();
        return roomDetails;

    } catch (error) {
        await browser.close();
        if (error.message.includes('Navigating frame was detached') && retries < MAX_RETRIES) {
            console.log(`Retrying due to frame detachment... Attempt ${retries + 1}`);
            return await scrapeRoomDetails(url, retries + 1);
        } else {
            throw error;
        }
    }
}

app.get('/check-puppeteer', async (req, res) => {
    try {
        // Launch Puppeteer
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/google-chrome',
            headless: false,
            args: ['--no-sandbox', '--disable-setuid-sandbox'],
        });

        // Close the browser
        await browser.close();

        res.status(200).send('Puppeteer is installed and functional.');
    } catch (error) {
        console.error('Error:', error);
        res.status(500).send('Puppeteer is not installed or not functional.');
    }
});


app.get('/Drury-Inn-Suites-Bowling-Green', async (req, res) => {

    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const url = 'https://www.druryhotels.com/bookandstay/newreservation/0066?bookItFastArrivalDate='+checkinDate+'&bookItFastDepartureDate='+checkoutDate;

    try {
        const roomDetails = await scrapeRoomDetails(url);
        res.json(roomDetails);
    } catch (error) {
        if (error.message === "no rooms are available") {
            res.status(404).json({ error: error.message });
        } else {
            res.status(500).json({ error: 'An error occurred while fetching room details.' });
        }
    }
});


app.get('/Hampton-Inn-Bowling-Green', async (req, res) => {

    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();


    const url = "https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=BWGKYHX&arrivalDate="+checkinDate+"&departureDate="+checkoutDate+"&room1NumAdults=1";
    try {
        // Launch the browser

        // Your URL and parameters

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        await page.waitForSelector('ol.grid', { timeout: 50000 }); // 30 seconds timeout

        // Extract <li> elements
        const rooms = await page.evaluate(() => {
            // Select the <ol> with the specific class
            const olElement = document.querySelector('ol.grid');
            if (!olElement) {
                return [];
            }

            // Extract <li> elements
            const liElements = olElement.querySelectorAll('li');
            const roomDetails = [];

            liElements.forEach((li) => {
                const text = li.innerText.trim();

                // Regular expression to extract room name and cash value
                const match = text.match(/^([\d\w\s]+)\s*\n[\d\w\s]+\nRoom details >\nBook From \$(\d+)/);
                
                if (match) {
                    const roomName = match[1].trim();
                    const cashValue = match[2].trim();

                    roomDetails.push({
                        roomName,
                        cashValue
                    });
                }
            });

            return roomDetails;
        });

        await browser.close();

        // Send the response
        res.json(rooms);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "no rooms are available" });
    }
});


app.get('/Hilton-Garden-Inn-Bowling-Green', async (req, res) => {

    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();


    const url = "https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=BNABGGI&arrivalDate="+checkinDate+"&departureDate="+checkoutDate+"&room1NumAdults=1";
    try {
        // Launch the browser

        // Your URL and parameters

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        await page.waitForSelector('ol.grid', { timeout: 50000 }); // 30 seconds timeout

        // Extract <li> elements
        const rooms = await page.evaluate(() => {
            // Select the <ol> with the specific class
            const olElement = document.querySelector('ol.grid');
            if (!olElement) {
                return [];
            }

            // Extract <li> elements
            const liElements = olElement.querySelectorAll('li');
            const roomDetails = [];

            liElements.forEach((li) => {
                const text = li.innerText.trim();

                // Regular expression to extract room name and cash value
                const match = text.match(/^([\d\w\s]+)\s*\n[\d\w\s]+\nRoom details >\nBook From \$(\d+)/);
                
                if (match) {
                    const roomName = match[1].trim();
                    const cashValue = match[2].trim();

                    roomDetails.push({
                        roomName,
                        cashValue
                    });
                }
            });

            return roomDetails;
        });

        await browser.close();

        // Send the response
        res.json(rooms);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "no rooms are available" });
    }
});


app.get('/Hilton-Garden-Inn-Bowling-Green', async (req, res) => {

    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();


    const url = "https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=BNABGGI&arrivalDate="+checkinDate+"&departureDate="+checkoutDate+"&room1NumAdults=1";
    try {
        // Launch the browser

        // Your URL and parameters

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        await page.waitForSelector('ol.grid', { timeout: 50000 }); // 30 seconds timeout

        // Extract <li> elements
        const rooms = await page.evaluate(() => {
            // Select the <ol> with the specific class
            const olElement = document.querySelector('ol.grid');
            if (!olElement) {
                return [];
            }

            // Extract <li> elements
            const liElements = olElement.querySelectorAll('li');
            const roomDetails = [];

            liElements.forEach((li) => {
                const text = li.innerText.trim();

                // Regular expression to extract room name and cash value
                const match = text.match(/^([\d\w\s]+)\s*\n[\d\w\s]+\nRoom details >\nBook From \$(\d+)/);
                
                if (match) {
                    const roomName = match[1].trim();
                    const cashValue = match[2].trim();

                    roomDetails.push({
                        roomName,
                        cashValue
                    });
                }
            });

            return roomDetails;
        });

        await browser.close();

        // Send the response
        res.json(rooms);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: "no rooms are available" });
    }
});


app.get('/Embassy-Suites-by-Hilton-Bowling-Green', async (req, res) => {

    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();
    // let url = 'https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=BWGLLES&arrivalDate='+checkinDate+'&departureDate='+checkoutDate+'&room1NumAdults=1'; // Replace with your URL

    const url = "https://www.hilton.com/en/book/reservation/rooms/?ctyhocn=BWGLLES&arrivalDate="+checkinDate+"&departureDate="+checkoutDate+"&room1NumAdults=1";
    try {
        // Launch the browser

        // Your URL and parameters

        await page.goto(url, { waitUntil: 'networkidle2', timeout: 0 });
        await page.waitForSelector('ol.grid', { timeout: 50000 }); // 30 seconds timeout

        // Extract <li> elements
        const rooms = await page.evaluate(() => {
            // Select the <ol> with the specific class
            const olElement = document.querySelector('ol.grid');
            if (!olElement) {
                return [];
            }

            // Extract <li> elements
            const liElements = olElement.querySelectorAll('li');
            const roomDetails = [];

            liElements.forEach((li) => {
                const text = li.innerText.trim();

                // Regular expression to extract room name and cash value
                const match = text.match(/^([\d\w\s]+)\s*\n[\d\w\s]+\nRoom details >\nBook From \$(\d+)/);
                
                if (match) {
                    const roomName = match[1].trim();
                    const cashValue = match[2].trim();

                    roomDetails.push({
                        roomName,
                        cashValue
                    });
                }
            });

            return roomDetails;
        });

        await browser.close();

        // Send the response
        res.json(rooms);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: error });
    }
});

// app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
// });






app.get('/Holiday-Inn-University-Plaza-Bowling-Green', async (req, res) => {
    
    const { checkinDate, checkoutDate } = req.query;

    if (!checkinDate || !checkoutDate) {
        return res.status(400).send('Please provide checkinDate and checkoutDate');
    }

    const browser = await puppeteer.launch({
        executablePath: '/usr/bin/google-chrome',
        headless: false,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    try {
        // Create a URL object
        var url = "https://www.ihg.com/holidayinn/hotels/us/en/find-hotels/select-roomrate?qDest=Holiday%20Inn%20University%20Plaza-Bowling%20Green&qPt=CASH&qCiD=28&qCoD=29&qCiMy=082024&qCoMy=082024&qAdlt=1&qChld=0&qRms=1&qAAR=6CBARC&qSlH=BWGWT&qAkamaiCC=IN&srb_u=1&qExpndSrch=false&qSrt=sBR&qBrs=6c.hi.ex.sb.ul.ic.cp.cw.in.vn.cv.rs.ki.ki.ma.sp.va.sp.re.vx.nd.sx.we.lx.rn.sn.sn.sn.sn.sn.nu&qWch=0&qSmP=0&qRad=30&qRdU=mi&setPMCookies=false&qpMbw=0&qErm=false&qpMn=0&qLoSe=false&qChAge=&qRmFltr=";
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
