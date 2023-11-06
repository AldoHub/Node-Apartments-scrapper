//http://localhost:4000/?zipcode=77068 --- call example

const cheerio = require("cheerio");
//const zipCode = "77002";
const axios = require("axios");
const handler = require("../libs/promiseHandler");
//let siteUrl = `https://www.apartments.com/houston-tx-${zipCode}/`;
let apartmentsData = [];
let currentPage = 1;
let totalPages = "";
let zipCode = "";
let siteUrl = "";


const fetchApartmentsData = async(req, res) => {
   
    zipCode = req.query.zipcode;
    if(siteUrl == ""){
        siteUrl = `https://www.apartments.com/houston-tx-${req.query.zipcode}/`;
    }

    console.log(`Currently fetching from: ${siteUrl}`);
    //handle the promise
    const [results, resultsError] = await handler(axios.get(siteUrl));
    
    //error happened
    if(resultsError){
        console.log("------->", err);
        return null;
    }

    //we got some stuff
    if(results){
       return cheerio.load(results.data);
    }

}


const apartmentsController = {
    getApartments: async(req, res) => {
      
        //make the fecth
        const $ = await fetchApartmentsData(req, res).catch(err => {
            //error during the fetch of the apartments
            if(err.code === "ENOTFOUND"){
                //returns the error as json
                res.status(404).json({
                    data: `${err.code} for ${err.hostname}`
                })
            }

        });



        //pages
        const apartmentsWrapper = $(".placards .placardContainer ul li article header div a .property-title span");
        //get the total pages inspecting the searchResults contents
        totalPages = await apartmentsController.getTotalPages($);
       
        //check where we are inside the count
        if(currentPage > totalPages){
            console.log("recursive process has finished, check the api response");
            res.json({data : {
                apartments: apartmentsData,
            }});
            currentPage = 1;
            zipCode = "";
            siteUrl = "";
            apartmentsData = [];
        }else{
            //add one to the page here to continue, on the next loop this will be picked
            currentPage++;
            //console.log(currentPage, totalPages);
            
            //change the default url to move to the next page
            siteUrl = `https://www.apartments.com/houston-tx-${zipCode}/${currentPage}/`;
            
            apartmentsWrapper.each((index, elem) => {
                apartmentsData.push($(elem).text());
            });

            //add a little timer to avoid upsetting the server
            setTimeout(async () => {
                //call again the getApartments function
                //pass again the request and the response to trigger a send request later
                await apartmentsController.getApartments(req, res).catch(err => console.log(`-------> Error: ${err}`));
            }, 3000);
        }

    },
    getTotalPages: async(pageData) => {
        //look for the pagination details
        const pagination = pageData(".pageRange");
        //return the number of pages or default to "1"
        let pages = pageData(pagination).text();
        let last = pages.split(" ").pop();
        if(last == "" || last == null || last == undefined){
            return 1;
        }else{
            return last;
        }
      
    }


}

//export the module
module.exports = apartmentsController;