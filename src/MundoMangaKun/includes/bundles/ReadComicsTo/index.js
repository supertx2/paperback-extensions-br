(function(f){if(typeof exports==="object"&&typeof module!=="undefined"){module.exports=f()}else if(typeof define==="function"&&define.amd){define([],f)}else{var g;if(typeof window!=="undefined"){g=window}else if(typeof global!=="undefined"){g=global}else if(typeof self!=="undefined"){g=self}else{g=this}g.Sources = f()}})(function(){var define,module,exports;return (function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.APIWrapper = void 0;
require("./models/impl_export");
class APIWrapper {
    getMangaDetails(source, mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getMangaDetails(mangaId);
        });
    }
    getChapters(source, mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getChapters(mangaId);
        });
    }
    getChapterDetails(source, mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getChapterDetails(mangaId, chapterId);
        });
    }
    searchRequest(source, query, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.searchRequest(query, metadata);
        });
    }
    getTags(source) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getTags();
        });
    }
    filterUpdatedManga(source, time, ids) {
        return __awaiter(this, void 0, void 0, function* () {
            // This method uses a callback to get multiple batches of updated manga. Aggrigate the data here
            // and return it all at once as a response
            var updateList = [];
            let callbackFunc = function (updates) {
                updateList.push(updates);
            };
            yield source.filterUpdatedManga(callbackFunc, time, ids);
            return updateList;
        });
    }
    getHomePageSections(source) {
        return __awaiter(this, void 0, void 0, function* () {
            // This method uses a callback to get multiple batches of a homesection. Aggrigate data and return all at once
            var sections = [];
            let callbackFunc = function (section) {
                sections.push(section);
            };
            yield source.getHomePageSections(callbackFunc);
            return sections;
        });
    }
    /**
     * Performs a 'get more' request. Usually this is done when a homesection has it's 'View More' button tapped, and the user
     * is starting to scroll through all of the available titles in each section.
     * It is recommended that when you write your tests for a source, that you run one test using this function,
     * for each homepageSectionId that the source offers, if those sections are expected to traverse multiple pages
     * @param source
     * @param homepageSectionId
     * @param metadata
     * @param resultPageLimiter How many pages this should attempt to iterate through at most. This prevents
     * you from being in an infinite loop. Defaults to 3.
     */
    getViewMoreItems(source, homepageSectionId, metadata, resultPageLimiter = 3) {
        return __awaiter(this, void 0, void 0, function* () {
            var results = [];
            // This may (and likely will) run multiple times, for multiple pages. Aggrigate up to the page limiter
            for (let i = 0; i < resultPageLimiter; i++) {
                let sourceResults = yield source.getViewMoreItems(homepageSectionId, metadata);
                if (sourceResults === null || sourceResults.results.length == 0) {
                    console.error(`getViewMoreItems was asked to run to a maximum of ${resultPageLimiter} pages, but retrieved no results on page ${i}`);
                    return results;
                }
                results = results.concat(sourceResults.results);
                metadata = sourceResults.metadata;
                // If there is no other pages available, meaning the metadata is empty, exit the loop and do not try again
                if (!sourceResults.metadata) {
                    break;
                }
            }
            return results;
        });
    }
    getWebsiteMangaDirectory(source, metadata) {
        return __awaiter(this, void 0, void 0, function* () {
            return source.getWebsiteMangaDirectory(metadata);
        });
    }
}
exports.APIWrapper = APIWrapper;

},{"./models/impl_export":40}],2:[function(require,module,exports){
"use strict";
/**
 * Request objects hold information for a particular source (see sources for example)
 * This allows us to to use a generic api to make the calls against any source
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.Source = void 0;
class Source {
    constructor(cheerio) {
        // <-----------        OPTIONAL METHODS        -----------> //
        /**
         * Manages the ratelimits and the number of requests that can be done per second
         * This is also used to fetch pages when a chapter is downloading
         */
        this.requestManager = createRequestManager({
            requestsPerSecond: 2.5,
            requestTimeout: 5000
        });
        this.cheerio = cheerio;
    }
    /**
     * (OPTIONAL METHOD) This function is called when ANY request is made by the Paperback Application out to the internet.
     * By modifying the parameter and returning it, the user can inject any additional headers, cookies, or anything else
     * a source may need to load correctly.
     * The most common use of this function is to add headers to image requests, since you cannot directly access these requests through
     * the source implementation itself.
     *
     * NOTE: This does **NOT** influence any requests defined in the source implementation. This function will only influence requests
     * which happen behind the scenes and are not defined in your source.
     */
    globalRequestHeaders() { return {}; }
    globalRequestCookies() { return []; }
    /**
     * A stateful source may require user input.
     * By supplying this value to the Source, the app will render your form to the user
     * in the application settings.
     */
    getAppStatefulForm() { return createUserForm({ formElements: [] }); }
    /**
     * When the Advanced Search is rendered to the user, this skeleton defines what
     * fields which will show up to the user, and returned back to the source
     * when the request is made.
     */
    getAdvancedSearchForm() { return createUserForm({ formElements: [] }); }
    /**
     * (OPTIONAL METHOD) Given a manga ID, return a URL which Safari can open in a browser to display.
     * @param mangaId
     */
    getMangaShareUrl(mangaId) { return null; }
    /**
     * If a source is secured by Cloudflare, this method should be filled out.
     * By returning a request to the website, this source will attempt to create a session
     * so that the source can load correctly.
     * Usually the {@link Request} url can simply be the base URL to the source.
     */
    getCloudflareBypassRequest() { return null; }
    /**
     * (OPTIONAL METHOD) A function which communicates with a given source, and returns a list of all possible tags which the source supports.
     * These tags are generic and depend on the source. They could be genres such as 'Isekai, Action, Drama', or they can be
     * listings such as 'Completed, Ongoing'
     * These tags must be tags which can be used in the {@link searchRequest} function to augment the searching capability of the application
     */
    getTags() { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) A function which should scan through the latest updates section of a website, and report back with a list of IDs which have been
     * updated BEFORE the supplied timeframe.
     * This function may have to scan through multiple pages in order to discover the full list of updated manga.
     * Because of this, each batch of IDs should be returned with the mangaUpdatesFoundCallback. The IDs which have been reported for
     * one page, should not be reported again on another page, unless the relevent ID has been detected again. You do not want to persist
     * this internal list between {@link Request} calls
     * @param mangaUpdatesFoundCallback A callback which is used to report a list of manga IDs back to the API
     * @param time This function should find all manga which has been updated between the current time, and this parameter's reported time.
     *             After this time has been passed, the system should stop parsing and return
     */
    filterUpdatedManga(mangaUpdatesFoundCallback, time, ids) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) A function which should readonly allf the available homepage sections for a given source, and return a {@link HomeSection} object.
     * The sectionCallback is to be used for each given section on the website. This may include a 'Latest Updates' section, or a 'Hot Manga' section.
     * It is recommended that before anything else in your source, you first use this sectionCallback and send it {@link HomeSection} objects
     * which are blank, and have not had any requests done on them just yet. This way, you provide the App with the sections to render on screen,
     * which then will be populated with each additional sectionCallback method called. This is optional, but recommended.
     * @param sectionCallback A callback which is run for each independant HomeSection.
     */
    getHomePageSections(sectionCallback) { return Promise.resolve(); }
    /**
     * (OPTIONAL METHOD) This function will take a given homepageSectionId and metadata value, and with this information, should return
     * all of the manga tiles supplied for the given state of parameters. Most commonly, the metadata value will contain some sort of page information,
     * and this request will target the given page. (Incrementing the page in the response so that the next call will return relevent data)
     * @param homepageSectionId The given ID to the homepage defined in {@link getHomePageSections} which this method is to readonly moreata about
     * @param metadata This is a metadata parameter which is filled our in the {@link getHomePageSections}'s return
     * function. Afterwards, if the metadata value returned in the {@link PagedResults} has been modified, the modified version
     * will be supplied to this function instead of the origional {@link getHomePageSections}'s version.
     * This is useful for keeping track of which page a user is on, pagnating to other pages as ViewMore is called multiple times.
     */
    getViewMoreItems(homepageSectionId, metadata) { return Promise.resolve(null); }
    /**
     * (OPTIONAL METHOD) This function is to return the entire library of a manga website, page by page.
     * If there is an additional page which needs to be called, the {@link PagedResults} value should have it's metadata filled out
     * with information needed to continue pulling information from this website.
     * Note that if the metadata value of {@link PagedResults} is undefined, this method will not continue to run when the user
     * attempts to readonly morenformation
     * @param metadata Identifying information as to what the source needs to call in order to readonly theext batch of data
     * of the directory. Usually this is a page counter.
     */
    getWebsiteMangaDirectory(metadata) { return Promise.resolve(null); }
    // <-----------        PROTECTED METHODS        -----------> //
    // Many sites use '[x] time ago' - Figured it would be good to handle these cases in general
    convertTime(timeAgo) {
        var _a;
        let time;
        let trimmed = Number(((_a = /\d*/.exec(timeAgo)) !== null && _a !== void 0 ? _a : [])[0]);
        trimmed = (trimmed == 0 && timeAgo.includes('a')) ? 1 : trimmed;
        if (timeAgo.includes('minutes')) {
            time = new Date(Date.now() - trimmed * 60000);
        }
        else if (timeAgo.includes('hours')) {
            time = new Date(Date.now() - trimmed * 3600000);
        }
        else if (timeAgo.includes('days')) {
            time = new Date(Date.now() - trimmed * 86400000);
        }
        else if (timeAgo.includes('year') || timeAgo.includes('years')) {
            time = new Date(Date.now() - trimmed * 31556952000);
        }
        else {
            time = new Date(Date.now());
        }
        return time;
    }
    /**
     * When a function requires a POST body, it always should be defined as a JsonObject
     * and then passed through this function to ensure that it's encoded properly.
     * @param obj
     */
    urlEncodeObject(obj) {
        let ret = {};
        for (const entry of Object.entries(obj)) {
            ret[encodeURIComponent(entry[0])] = encodeURIComponent(entry[1]);
        }
        return ret;
    }
}
exports.Source = Source;

},{}],3:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Source"), exports);

},{"./Source":2}],4:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./base"), exports);
__exportStar(require("./models"), exports);
__exportStar(require("./APIWrapper"), exports);

},{"./APIWrapper":1,"./base":3,"./models":41}],5:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createChapterDetails = function (chapterDetails) {
    return chapterDetails;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],6:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });

},{}],7:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createChapter = function (chapter) {
    return chapter;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],8:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],9:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],10:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createHomeSection = function (section) {
    return section;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],11:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],12:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LanguageCode = void 0;
var LanguageCode;
(function (LanguageCode) {
    LanguageCode["UNKNOWN"] = "_unknown";
    LanguageCode["BENGALI"] = "bd";
    LanguageCode["BULGARIAN"] = "bg";
    LanguageCode["BRAZILIAN"] = "br";
    LanguageCode["CHINEESE"] = "cn";
    LanguageCode["CZECH"] = "cz";
    LanguageCode["GERMAN"] = "de";
    LanguageCode["DANISH"] = "dk";
    LanguageCode["ENGLISH"] = "gb";
    LanguageCode["SPANISH"] = "es";
    LanguageCode["FINNISH"] = "fi";
    LanguageCode["FRENCH"] = "fr";
    LanguageCode["WELSH"] = "gb";
    LanguageCode["GREEK"] = "gr";
    LanguageCode["CHINEESE_HONGKONG"] = "hk";
    LanguageCode["HUNGARIAN"] = "hu";
    LanguageCode["INDONESIAN"] = "id";
    LanguageCode["ISRELI"] = "il";
    LanguageCode["INDIAN"] = "in";
    LanguageCode["IRAN"] = "ir";
    LanguageCode["ITALIAN"] = "it";
    LanguageCode["JAPANESE"] = "jp";
    LanguageCode["KOREAN"] = "kr";
    LanguageCode["LITHUANIAN"] = "lt";
    LanguageCode["MONGOLIAN"] = "mn";
    LanguageCode["MEXIAN"] = "mx";
    LanguageCode["MALAY"] = "my";
    LanguageCode["DUTCH"] = "nl";
    LanguageCode["NORWEGIAN"] = "no";
    LanguageCode["PHILIPPINE"] = "ph";
    LanguageCode["POLISH"] = "pl";
    LanguageCode["PORTUGUESE"] = "pt";
    LanguageCode["ROMANIAN"] = "ro";
    LanguageCode["RUSSIAN"] = "ru";
    LanguageCode["SANSKRIT"] = "sa";
    LanguageCode["SAMI"] = "si";
    LanguageCode["THAI"] = "th";
    LanguageCode["TURKISH"] = "tr";
    LanguageCode["UKRAINIAN"] = "ua";
    LanguageCode["VIETNAMESE"] = "vn";
})(LanguageCode = exports.LanguageCode || (exports.LanguageCode = {}));

},{}],13:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createMangaTile = function (mangaTile) {
    return mangaTile;
};
_global.createIconText = function (iconText) {
    return iconText;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],14:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],15:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createMangaUpdates = function (update) {
    return update;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],16:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],17:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createManga = function (manga) {
    return manga;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],18:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MangaStatus = void 0;
var MangaStatus;
(function (MangaStatus) {
    MangaStatus[MangaStatus["ONGOING"] = 1] = "ONGOING";
    MangaStatus[MangaStatus["COMPLETED"] = 0] = "COMPLETED";
})(MangaStatus = exports.MangaStatus || (exports.MangaStatus = {}));

},{}],19:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createPagedResults = function (update) {
    return update;
};
_global.isOAuthTokenExpired = function (token) {
    return (new Date().getMilliseconds() / 1000) > (token.createdAt + token.expiresIn - 3600);
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],20:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],21:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createPagedResults = function (update) {
    return update;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],22:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],23:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],24:[function(require,module,exports){
(function (global){(function (){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createRequestManager = function (info) {
    const axios = require('axios');
    return Object.assign(Object.assign({}, info), { schedule: function (request, retryCount) {
            var _a, _b, _c, _d, _e;
            return __awaiter(this, void 0, void 0, function* () {
                // Append any cookies into the header properly
                let headers = (_a = request.headers) !== null && _a !== void 0 ? _a : {};
                let cookieData = '';
                for (let cookie of (_b = request.cookies) !== null && _b !== void 0 ? _b : [])
                    cookieData += `${cookie.name}=${cookie.value};`;
                headers['cookie'] = cookieData;
                // If no user agent has been supplied, default to a basic Paperback-iOS agent
                headers['user-agent'] = (_c = headers["user-agent"]) !== null && _c !== void 0 ? _c : 'Paperback-iOS';
                // If we are using a urlencoded form data as a post body, we need to decode the request for Axios
                let decodedData = request.data;
                if ((_d = headers['content-type']) === null || _d === void 0 ? void 0 : _d.includes('application/x-www-form-urlencoded')) {
                    decodedData = "";
                    for (let attribute in request.data) {
                        if (decodedData) {
                            decodedData += "&";
                        }
                        decodedData += `${attribute}=${request.data[attribute]}`;
                    }
                }
                // We must first get the response object from Axios, and then transcribe it into our own Response type before returning
                let response = yield axios({
                    url: `${request.url}${(_e = request.param) !== null && _e !== void 0 ? _e : ''}`,
                    method: request.method,
                    headers: headers,
                    data: decodedData,
                    timeout: info.requestTimeout || 0
                });
                return Promise.resolve(createResponseObject({
                    data: response.data,
                    status: response.status,
                    headers: response.headers,
                    request: request
                }));
            });
        } });
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"axios":"axios"}],25:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],26:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createCookie = function (cookie) {
    return cookie;
};
_global.createRequestObject = function (request) {
    return request;
};
_global.createRequestObject = function (requestObject) {
    return requestObject;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],27:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],28:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createResponseObject = function (responseObject) {
    return responseObject;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],29:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],30:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createSearchRequest = function (searchRequest) {
    return searchRequest;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],31:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],32:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],33:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TagType = void 0;
/**
 * An enumerator which {@link SourceTags} uses to define the color of the tag rendered on the website.
 * Five types are available: blue, green, grey, yellow and red, the default one is blue.
 * Common colors are red for (Broken), yellow for (+18), grey for (Country-Proof)
 */
var TagType;
(function (TagType) {
    TagType["BLUE"] = "default";
    TagType["GREEN"] = "success";
    TagType["GREY"] = "info";
    TagType["YELLOW"] = "warning";
    TagType["RED"] = "danger";
})(TagType = exports.TagType || (exports.TagType = {}));

},{}],34:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createTagSection = function (tagSection) {
    return tagSection;
};
_global.createTag = function (tag) {
    return tag;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],35:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],36:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createTrackObject = function (trackObject) {
    return trackObject;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],37:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],38:[function(require,module,exports){
(function (global){(function (){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const _global = global;
_global.createUserForm = function (userForm) {
    return userForm;
};
_global.createTextFieldObject = function (textField) {
    return textField;
};
_global.createToggleFieldObject = function (toggleField) {
    return toggleField;
};
_global.createPickerFieldObject = function (pickerField) {
    return pickerField;
};
_global.createComboFieldObject = function (comboField) {
    return comboField;
};

}).call(this)}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],39:[function(require,module,exports){
arguments[4][6][0].apply(exports,arguments)
},{"dup":6}],40:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("./Chapter/_impl");
require("./ChapterDetails/_impl");
require("./HomeSection/_impl");
require("./Manga/_impl");
require("./MangaTile/_impl");
require("./RequestObject/_impl");
require("./ResponseObject/_impl");
require("./SearchRequest/_impl");
require("./TagSection/_impl");
require("./PagedResults/_impl");
require("./RequestManager/_impl");
require("./TrackObject/_impl");
require("./OAuth/_impl");
require("./MangaUpdate/_impl");
require("./UserForm/_impl");

},{"./Chapter/_impl":7,"./ChapterDetails/_impl":5,"./HomeSection/_impl":10,"./Manga/_impl":17,"./MangaTile/_impl":13,"./MangaUpdate/_impl":15,"./OAuth/_impl":19,"./PagedResults/_impl":21,"./RequestManager/_impl":24,"./RequestObject/_impl":26,"./ResponseObject/_impl":28,"./SearchRequest/_impl":30,"./TagSection/_impl":34,"./TrackObject/_impl":36,"./UserForm/_impl":38}],41:[function(require,module,exports){
"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !exports.hasOwnProperty(p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
__exportStar(require("./Chapter"), exports);
__exportStar(require("./ChapterDetails"), exports);
__exportStar(require("./HomeSection"), exports);
__exportStar(require("./Manga"), exports);
__exportStar(require("./MangaTile"), exports);
__exportStar(require("./RequestObject"), exports);
__exportStar(require("./SearchRequest"), exports);
__exportStar(require("./TagSection"), exports);
__exportStar(require("./SourceTag"), exports);
__exportStar(require("./Languages"), exports);
__exportStar(require("./Constants"), exports);
__exportStar(require("./MangaUpdate"), exports);
__exportStar(require("./PagedResults"), exports);
__exportStar(require("./ResponseObject"), exports);
__exportStar(require("./RequestManager"), exports);
__exportStar(require("./RequestHeaders"), exports);
__exportStar(require("./SourceInfo"), exports);
__exportStar(require("./TrackObject"), exports);
__exportStar(require("./OAuth"), exports);
__exportStar(require("./UserForm"), exports);

},{"./Chapter":8,"./ChapterDetails":6,"./Constants":9,"./HomeSection":11,"./Languages":12,"./Manga":18,"./MangaTile":14,"./MangaUpdate":16,"./OAuth":20,"./PagedResults":22,"./RequestHeaders":23,"./RequestManager":25,"./RequestObject":27,"./ResponseObject":29,"./SearchRequest":31,"./SourceInfo":32,"./SourceTag":33,"./TagSection":35,"./TrackObject":37,"./UserForm":39}],42:[function(require,module,exports){
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const READCOMICTO_DOMAIN = 'https://readcomiconline.li';
class Parser {
    parseMangaDetails($, mangaId) {
        var _a, _b;
        let titles = [$('.bigChar', $('.bigBarContainer').first()).text().trim()];
        let url = $('img', $('.rightBox')).attr('src');
        let image = (url === null || url === void 0 ? void 0 : url.includes('http')) ? url : `${READCOMICTO_DOMAIN}${url}`;
        let status = paperback_extensions_common_1.MangaStatus.ONGOING, author, released, rating = 0, artist, views, summary;
        let tagArray0 = [];
        let i = 0;
        let infoElement = $("div.barContent").first();
        artist = this.decodeHTMLEntity($('p:has(span:contains(Artist:)) > a', infoElement).first().text());
        author = ($('p:has(span:contains(Writer:)) > a', infoElement).first().text());
        summary = ($('p:has(span:contains(Summary:)) ~ p', infoElement).text());
        released = this.decodeHTMLEntity($('p:has(span:contains(Publication date:))', infoElement).first().text()).replace('Publication date:', '').trim();
        let statusViewsParagraph = $('p:has(span:contains(Status:))', infoElement).first().text().toLowerCase();
        status = statusViewsParagraph.includes('ongoing') ? paperback_extensions_common_1.MangaStatus.ONGOING : paperback_extensions_common_1.MangaStatus.COMPLETED;
        views = Number((_b = (_a = statusViewsParagraph.replace('\n', '').split('\n')[1]) === null || _a === void 0 ? void 0 : _a.trim()) === null || _b === void 0 ? void 0 : _b.replace(/\D/g, ''));
        let genres = $('p:has(span:contains(Genres:)) > a', infoElement).toArray();
        for (let obj of genres) {
            let id = $(obj).attr('href');
            let label = this.decodeHTMLEntity($(obj).text().trim());
            if (typeof id === 'undefined' || typeof label === 'undefined')
                continue;
            tagArray0 = [...tagArray0, createTag({ id: id, label: label })];
        }
        let tagSections = [createTagSection({ id: '0', label: 'genres', tags: tagArray0 })];
        return createManga({
            id: mangaId,
            rating: rating,
            titles: titles,
            image: image !== null && image !== void 0 ? image : '',
            status: status,
            author: this.decodeHTMLEntity(author !== null && author !== void 0 ? author : ''),
            artist: artist,
            views: views,
            tags: tagSections,
            desc: this.decodeHTMLEntity(summary !== null && summary !== void 0 ? summary : ''),
            lastUpdate: released
        });
    }
    parseChapterList($, mangaId) {
        var _a, _b;
        let chapters = [];
        let chapArray = $('tr', $('.listing').first()).toArray().reverse();
        for (let i = 0; i < chapArray.length; i++) {
            let obj = chapArray[i];
            let chapterId = (_b = (_a = $('a', obj)) === null || _a === void 0 ? void 0 : _a.first().attr('href')) === null || _b === void 0 ? void 0 : _b.replace(`/Comic/${mangaId}/`, '');
            let chapter = $('td', obj).first();
            let chapNum = i + 1;
            let chapName = chapter.text().trim();
            let time = $('td', $(obj)).last().text().trim();
            if (typeof chapterId === 'undefined' || !time || isNaN(chapNum))
                continue;
            chapters.push(createChapter({
                id: chapterId,
                mangaId: mangaId,
                chapNum: Number(chapNum),
                langCode: paperback_extensions_common_1.LanguageCode.ENGLISH,
                name: this.decodeHTMLEntity(chapName),
                time: new Date(time)
            }));
        }
        return chapters;
    }
    parseChapterDetails(data) {
        let pages = [...data.matchAll(/lstImages\.push\("(http.*)"\)/g)];
        return pages.map(match => match[1]);
    }
    parseSearchResults($, cheerio) {
        var _a, _b, _c, _d;
        let mangaTiles = [];
        let collectedIds = [];
        let directManga = $('.barTitle', $('.rightBox')).first().text().trim();
        if (directManga === 'Cover') {
            let titleText = $('.bigChar', $('.bigBarContainer').first()).text().trim();
            let id = (_b = ($('a'), (_a = $('.bigChar').attr('href')) === null || _a === void 0 ? void 0 : _a.replace('/Comic/', ''))) !== null && _b !== void 0 ? _b : '';
            let url = $('img', $('.rightBox')).attr('src');
            let image = (url === null || url === void 0 ? void 0 : url.includes('http')) ? url : `${READCOMICTO_DOMAIN}${url}`;
            if (id === undefined) {
                console.log("Something went wrong, Manga ID Undefined");
                return [];
            }
            else {
                if (!collectedIds.includes(id)) {
                    mangaTiles.push(createMangaTile({
                        id: id,
                        title: createIconText({ text: titleText }),
                        image: image
                    }));
                    collectedIds.push(id);
                }
            }
        }
        else {
            for (let obj of $('tr', $('.listing')).toArray()) {
                let titleText = this.decodeHTMLEntity($('a', $(obj)).first().text().replace('\n', '').trim());
                let id = (_c = $('a', $(obj)).attr('href')) === null || _c === void 0 ? void 0 : _c.replace('/Comic/', '');
                if (!titleText || !id) {
                    continue;
                }
                //Tooltip Selecting 
                let imageCheerio = cheerio.load((_d = $('td', $(obj)).first().attr('title')) !== null && _d !== void 0 ? _d : '');
                let url = this.decodeHTMLEntity(imageCheerio('img').attr('src'));
                let image = url.includes('http') ? url : `${READCOMICTO_DOMAIN}${url}`;
                if (typeof id === 'undefined' || typeof image === 'undefined')
                    continue;
                if (!collectedIds.includes(id)) {
                    mangaTiles.push(createMangaTile({
                        id: id,
                        title: createIconText({ text: titleText }),
                        image: image
                    }));
                    collectedIds.push(id);
                }
            }
        }
        return mangaTiles;
    }
    parseTags($) {
        var _a, _b;
        let tagSections = [createTagSection({ id: '0', label: 'genres', tags: [] }),
            createTagSection({ id: '1', label: 'format', tags: [] })];
        for (let obj of $('a', $('.home-list')).toArray()) {
            let id = (_b = (_a = $(obj).attr('href')) === null || _a === void 0 ? void 0 : _a.replace(`${READCOMICTO_DOMAIN}/`, '').trim()) !== null && _b !== void 0 ? _b : $(obj).text().trim();
            let genre = $(obj).text().trim();
            tagSections[0].tags.push(createTag({ id: id, label: genre }));
        }
        tagSections[1].tags.push(createTag({ id: 'comic/', label: 'Comic' }));
        return tagSections;
    }
    parseHomePageSection($, cheerio) {
        var _a, _b;
        let tiles = [];
        let collectedIds = [];
        for (let obj of $('tr', $('.listing')).toArray()) {
            let titleText = this.decodeHTMLEntity($('a', $(obj)).first().text().replace('\n', '').trim());
            let id = (_a = $('a', $(obj)).attr('href')) === null || _a === void 0 ? void 0 : _a.replace('/Comic/', '');
            if (!titleText || !id) {
                continue;
            }
            //Tooltip Selecting 
            let imageCheerio = cheerio.load((_b = $('td', $(obj)).first().attr('title')) !== null && _b !== void 0 ? _b : '');
            let url = this.decodeHTMLEntity(imageCheerio('img').attr('src'));
            let image = url.includes('http') ? url : `${READCOMICTO_DOMAIN}${url}`;
            if (typeof id === 'undefined' || typeof image === 'undefined')
                continue;
            if (!collectedIds.includes(id)) {
                tiles.push(createMangaTile({
                    id: id,
                    title: createIconText({ text: titleText }),
                    image: image
                }));
                collectedIds.push(id);
            }
        }
        return tiles;
    }
    isLastPage($) {
        return !$('.pager').text().includes('Next');
    }
    decodeHTMLEntity(str) {
        return str.replace(/&#(\d+);/g, function (match, dec) {
            return String.fromCharCode(dec);
        });
    }
}
exports.Parser = Parser;

},{"paperback-extensions-common":4}],43:[function(require,module,exports){
"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ReadComicsTo = exports.ReadComicsToInfo = void 0;
const paperback_extensions_common_1 = require("paperback-extensions-common");
const Parser_1 = require("./Parser");
const READCOMICSTO_DOMAIN = 'https://readcomiconline.li';
exports.ReadComicsToInfo = {
    version: '1.0.7',
    name: 'ReadComicsOnlineLi',
    description: 'Extension that pulls western comics from readcomiconline.li',
    author: 'Aurora',
    authorWebsite: 'https://github.com/Aur0raN',
    icon: "logo.png",
    hentaiSource: false,
    websiteBaseURL: READCOMICSTO_DOMAIN,
    sourceTags: [
        {
            text: "Buggy",
            type: paperback_extensions_common_1.TagType.RED
        }
    ]
};
class ReadComicsTo extends paperback_extensions_common_1.Source {
    constructor() {
        super(...arguments);
        this.requestManager = createRequestManager({
            requestsPerSecond: 1.5,
            requestTimeout: 15000,
        });
        this.baseUrl = READCOMICSTO_DOMAIN;
        this.userAgentRandomizer = `Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:77.0) Gecko/20100101 Firefox/78.0${Math.floor(Math.random() * 100000)}`;
        this.parser = new Parser_1.Parser();
    }
    getMangaShareUrl(mangaId) {
        return `${READCOMICSTO_DOMAIN}/Comic/${mangaId}`;
    }
    getMangaDetails(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSTO_DOMAIN}/Comic/${mangaId}`,
                method: 'GET',
                headers: this.constructHeaders({})
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            return this.parser.parseMangaDetails($, mangaId);
        });
    }
    getChapters(mangaId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSTO_DOMAIN}/Comic/${mangaId}`,
                method: "GET",
                headers: this.constructHeaders({})
            });
            const data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let chapters = this.parser.parseChapterList($, mangaId);
            return chapters;
        });
    }
    getChapterDetails(mangaId, chapterId) {
        return __awaiter(this, void 0, void 0, function* () {
            let request = createRequestObject({
                url: `${READCOMICSTO_DOMAIN}/Comic/${mangaId}/${chapterId}`,
                method: 'GET',
                param: '?readType=1&quality=hq',
                headers: this.constructHeaders({})
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let pages = this.parser.parseChapterDetails(data.data);
            return createChapterDetails({
                id: chapterId,
                mangaId: mangaId,
                pages: pages,
                longStrip: false
            });
        });
    }
    searchRequest(query, metadata) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            let request = this.constructSearchRequest((_b = query.title) !== null && _b !== void 0 ? _b : '');
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let manga = this.parser.parseSearchResults($, this.cheerio);
            let mData = undefined;
            if (!this.parser.isLastPage($)) {
                mData = { page: (page + 1) };
            }
            return createPagedResults({
                results: manga,
                metadata: mData
            });
        });
    }
    // async getTags(): Promise<TagSection[] | null> {
    //     const request = createRequestObject({
    //         url: `${READCOMICSTO_DOMAIN}/comic-genres/`,
    //         method: 'GET'
    //     })
    //     const data = await this.requestManager.schedule(request, 1)
    //     let $ = this.cheerio.load(data.data)
    //     return this.parser.parseTags($)
    // }
    getHomePageSections(sectionCallback) {
        return __awaiter(this, void 0, void 0, function* () {
            const sections = [
                {
                    request: createRequestObject({
                        url: `${READCOMICSTO_DOMAIN}/ComicList/Newest`,
                        method: 'GET',
                        headers: this.constructHeaders({})
                    }),
                    section: createHomeSection({
                        id: '0',
                        title: 'NEWEST COMICS',
                        view_more: true
                    }),
                },
                {
                    request: createRequestObject({
                        url: `${READCOMICSTO_DOMAIN}/ComicList/LatestUpdate`,
                        method: 'GET',
                        headers: this.constructHeaders({})
                    }),
                    section: createHomeSection({
                        id: '1',
                        title: 'RECENTLY UPDATED',
                        view_more: true,
                    }),
                },
                {
                    request: createRequestObject({
                        url: `${READCOMICSTO_DOMAIN}/ComicList/MostPopular`,
                        method: 'GET',
                        headers: this.constructHeaders({})
                    }),
                    section: createHomeSection({
                        id: '2',
                        title: 'MOST POPULAR',
                        view_more: true,
                    }),
                },
            ];
            const promises = [];
            for (const section of sections) {
                // Let the app load empty sections
                sectionCallback(section.section);
                // Get the section data
                promises.push(this.requestManager.schedule(section.request, 1).then(response => {
                    const $ = this.cheerio.load(response.data);
                    section.section.items = this.parser.parseSearchResults($, this.cheerio);
                    sectionCallback(section.section);
                }));
            }
            // Make sure the function completes
            yield Promise.all(promises);
        });
    }
    getViewMoreItems(homepageSectionId, metadata) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            let webPage = '';
            let page = (_a = metadata === null || metadata === void 0 ? void 0 : metadata.page) !== null && _a !== void 0 ? _a : 1;
            switch (homepageSectionId) {
                case '0': {
                    webPage = `/ComicList/Newest?page=${page}`;
                    break;
                }
                case '1': {
                    webPage = `/ComicList/LatestUpdate?page=${page}`;
                    break;
                }
                case '2': {
                    webPage = `/ComicList/MostPopular?page=${page}`;
                    break;
                }
                default:
                    return Promise.resolve(null);
            }
            let request = createRequestObject({
                url: `${READCOMICSTO_DOMAIN}${webPage}`,
                method: 'GET',
                headers: this.constructHeaders({})
            });
            let data = yield this.requestManager.schedule(request, 1);
            let $ = this.cheerio.load(data.data);
            let manga = this.parser.parseHomePageSection($, this.cheerio);
            let mData;
            if (!this.parser.isLastPage($)) {
                mData = { page: (page + 1) };
            }
            else {
                mData = undefined; // There are no more pages to continue on to, do not provide page metadata
            }
            return createPagedResults({
                results: manga,
                metadata: mData
            });
        });
    }
    constructHeaders(headers, refererPath) {
        if (this.userAgentRandomizer !== '') {
            headers["user-agent"] = this.userAgentRandomizer;
        }
        headers["referer"] = `${this.baseUrl}${refererPath !== null && refererPath !== void 0 ? refererPath : ''}`;
        headers["content-type"] = "application/x-www-form-urlencoded";
        return headers;
    }
    globalRequestHeaders() {
        if (this.userAgentRandomizer !== '') {
            return {
                "referer": `${this.baseUrl}/`,
                "user-agent": this.userAgentRandomizer,
                "accept": "image/jpeg,image/png,image/*;q=0.8"
            };
        }
        else {
            return {
                "referer": `${this.baseUrl}/`,
                "accept": "image/jpeg,image/png,image/*;q=0.8"
            };
        }
    }
    CloudFlareError(status) {
        if (status == 503) {
            throw new Error('CLOUDFLARE BYPASS ERROR:\nPlease go to Settings > Sources > \<\The name of this source\> and press Cloudflare Bypass');
        }
    }
    constructSearchRequest(searchQuery) {
        let isSearch = searchQuery != '';
        let data = {
            "keyword": searchQuery,
        };
        return createRequestObject({
            url: `${READCOMICSTO_DOMAIN}/Search/Comic`,
            method: 'POST',
            headers: this.constructHeaders({}),
            data: this.urlEncodeObject(data),
        });
    }
    getCloudflareBypassRequest() {
        return createRequestObject({
            url: `${READCOMICSTO_DOMAIN}/Comic/The-Walking-Dead/Issue-1?id=1715`,
            method: 'GET',
        });
    }
}
exports.ReadComicsTo = ReadComicsTo;

},{"./Parser":42,"paperback-extensions-common":4}]},{},[43])(43)
});
