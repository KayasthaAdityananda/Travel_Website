const Listing = require("../models/listing");
const mbxGeocoding = require('@mapbox/mapbox-sdk/services/geocoding');
const mapToken = process.env.MAP_TOKEN;
const geocodingClient = mbxGeocoding({ accessToken: mapToken });

module.exports.Index = async (req, res) => {
    const alllistings = await Listing.find({});
    res.render("listings/index.ejs", { alllistings });
};

module.exports.Show = async (req, res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id)
        .populate({
            path: "reviews",
            populate: {
                path: "author",
            },
        })
        .populate("owner");

    if (!listing) {
        req.flash("error", "Does not exist");
        return res.redirect("/listings");
    }

    res.render('listings/show.ejs', { listing });
};

module.exports.Create = async (req, res, next) =>{
    
    let response = await geocodingClient
        .forwardGeocode({
            query: req.body.listing.location,
            limit: 1,
        })
        .send();

    let url = req.file.path;
    let filename = req.file.filename;
    const newListing = new Listing(req.body.listing);
    newListing.owner = req.user._id;
    newListing.image = { url, filename };

    newListing.geometry = response.body.features[0].geometry;

    let result = await newListing.save();
    console.log(result);
    
    req.flash("success", "New Listing added!");
    res.redirect("/listings");
};

module.exports.Edit = async(req,res) => {
    let { id } = req.params;
    const listing = await Listing.findById(id);
    if (!listing) {
        req.flash("error", "Does not exist");
        return res.redirect("/listings");
    }

    let originalImageUrl = listing.image.url;
    originalImageUrl.replace("/upload", "/upload/w_250");

    res.render("listings/edit.ejs", { listing, originalImageUrl });
};

module.exports.Update = async (req, res) => {
    let { id } = req.params; 
    let listing = await Listing.findByIdAndUpdate(id, {...req.body.listing});
    
    if(typeof req.file != "undefined") {
        let url = req.file.path;
        let filename = req.file.filename;
        listing.image = { url, filename };
        await listing.save(); 
    }

    req.flash("success", "Listing Updated");
    res.redirect("/listings");
};

module.exports.Delete = async (req, res) =>{
    let { id } = req.params;
    await Listing.findByIdAndDelete(id);
    req.flash("deleted", "Deleted a listing");
    res.redirect("/listings");
};

module.exports.New = (req, res) => {
    res.render('listings/new.ejs');
};