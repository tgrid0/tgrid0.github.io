var zoneids = [7546, 7672, 7673, 7787, 7805, 7812, 7855, 8040, 8079, 8443];
var zones =
[
    "Neltharion's Lair",
    "Halls of Valor",
    "Darkheart Thicket",
    "Vault of the Wardens",
    "Black Rook Hold",
    "Maw of Souls",
    "The Arcway",
    "Eye of Azshara",
    "Court of Stars",
    "Return to Karazhan",
    "All"
];

var stats = ["Crit", "Haste", "Mastery", "Versatility"];
var slots = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket"];

var settings = 
{
    "items_per_page": 10,
    "statsfilters": [],
    "slotsfilters": []
}

var columns = ["name", "slot", "crit", "haste", "mastery", "versatility", "zone", "inlist"];
var orders = [false, false, false, false, false, false, false, false];
var locales = {"en": 0, "ru": 1, "de": 2, "fr": 3};
var locdata = [];

var currentlocale = "en";
var currentpage = -1; // 0 - items, 1 - instances
var currentilvl = 0;

var items = [];
var processedRequests = zoneids.length;

function setLocale(loc) {
    currentlocale = loc;
    items.forEach(function(item, i, items) {
        item["name"] = locdata[locales[currentlocale]][item["id"]];
    });
    Object.keys(locales).forEach(function(key) {
        $("#loc" + key).removeClass("default-button-active");
    });
    $("#loc" + currentlocale).addClass("default-button-active");
    if (currentpage == 0) {
        presentItemTable();
    }
}

function handleRequest() {
    if (!--processedRequests) {
        $.ajax({
            type: 'GET',
            url: "/locale/locale.json",
            dataType: 'json',
            success: function(data) {
                locdata = locdata.concat(data);
                setLocale("en");
                loadItemPage();
            }
        }); 
    }
}

$(document).ready(function() {
    for (var i = 0; i < zoneids.length; i++) {
        $.ajax({
            type: 'GET',
            url: "/data/data" + zoneids[i] + ".json",
            dataType: 'json',
            success: function(data) {
                var defer = $.Deferred();
                data.forEach(function(item, i, data) {
                  item["inlist"] = false;
                });
                items = items.concat(data);
                handleRequest();
                defer.resolve();
            }
        });
    }
    /*$.ajax({
        type: 'GET',
        url: "/data/allitems.json",
        dataType: 'json',
        success: function(data) {
            items = items.concat(data);
            items.forEach(function(item, i, items) {
              item["inlist"] = false;
            });
            loadItemPage();
        },
        error: function() {
            console.log("Error loading items data!");
        }
    });*/
});

function generateTableButton(columnId, name) {
    return "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(" + columnId + ")\">" + name + "</button></th>";
}

function presentItemTable() {
    var items_to_show = $("#items_per_page").val();
    var items_table = "<table class=\"default-table\">";
    items_table += "<tr>";
    items_table += generateTableButton(0, "Item");
    items_table += generateTableButton(1, "Slot");
    items_table += generateTableButton(2, "Crit");
    items_table += generateTableButton(3, "Haste");
    items_table += generateTableButton(4, "Mastery");
    items_table += generateTableButton(5, "Versatility");
    items_table += generateTableButton(6, "Instance");
    items_table += generateTableButton(7, "In list");
    items_table += "</tr>";
    var show_crit = $('#statsfilter0').prop("checked");
    var show_haste = $('#statsfilter1').prop("checked");
    var show_mastery = $('#statsfilter2').prop("checked");
    var show_versatility = $('#statsfilter3').prop("checked");
    var shown_items = 0;
    var total_items = items.length;
    for (var i = 0; i < total_items; i++) {
        if ((show_crit && items[i]["crit"] > 0) ||
            (show_haste && items[i]["haste"] > 0) ||
            (show_mastery && items[i]["mastery"] > 0) ||
            (show_versatility && items[i]["versatility"])) {
            items_table += "<tr><td>" + items[i]["name"] + "</td><td>" + items[i]["slot"] + "</td>";
            items_table += "<td>" + items[i]["crit"][currentilvl] + "</td><td>" + items[i]["haste"][currentilvl] + "</td><td>" + items[i]["mastery"][currentilvl] + "</td><td>" + items[i]["versatility"][currentilvl] + "</td>";
            items_table += "<td>" + zones[items[i]["zone"]] + "</td>";
            items_table += "<td><button id=\"t_list_check" + i + "\" onclick=\"setInList(" + i + ")\" class=\"default-button\" style=\"width: 100%;" + (items[i]["inlist"] ? "background-color:green;\">Remove" : "\">Add") + "</button></td></tr>";
            shown_items++;
        }
        if (shown_items >= items_to_show)
            break;
    }
    items_table += "</table>";
    $('#items_table').html(items_table);
}

function sortByColumn(co) {
    items.sort(function(a, b) {
        return orders[co] ? a[columns[co]] < b[columns[co]]: a[columns[co]] > b[columns[co]];
    });
    orders[co] = !orders[co];
    presentItemTable();
}

function setInList(index) {
    items[index]["inlist"] = !items[index]["inlist"];
    var b = items[index]["inlist"];
    $("#t_list_check" + index).css("background-color", b ? "green" : "#154aa5");
    $("#t_list_check" + index).html(b ? "Remove" : "Add");
}

function saveSettings() {
    if (currentpage == 0) {
        for (var i = 0, length = stats.length; i < length; i++) {
            settings["statsfilters"][i] = $("#statsfilter" + i).prop("checked");
        }
        for (var i = 0, length = slots.length; i < length; i++) {
            settings["slotsfilters"][i] = $("#slotsfilter" + i).prop("checked");
        }
        settings["items_per_page"] = $("#items_per_page").val();
    }
}

function loadSettings() {
    for (var i = 0, length = stats.length; i < length; i++) {
        $("#statsfilter" + i).prop("checked", settings["statsfilters"][i]);
    }
    for (var i = 0, length = slots.length; i < length; i++) {
        $("#slotsfilter" + i).prop("checked", settings["slotsfilters"][i]);
    }
    $("#items_per_page").val("" + settings["items_per_page"]).change();
}

function loadItemPage() {
    if (currentpage != 0) {
        $("#page-content").html(constructItemPage());
        loadSettings();
        currentpage = 0;
        presentItemTable();     
    }
}

function loadInstPage() {
    if (currentpage != 1) {
        saveSettings();
        $("#page-content").html(constructWishList());
        currentpage = 1;
    }
}

function loadInExpPage() {
    if (currentpage != 2) {
        saveSettings();
        $("#page-content").html(concstructInExpPage());
        currentpage = 2;
    }
}

function constructWishList() {
    var response_string = "";
    var item_strings = [];
    for (var i = 0, length = zoneids.length; i < length; i++) {
        item_strings[i] = "";
    }
    for (var i = 0, length = items.length; i < length; i++) {
        if (items[i]["inlist"]) {
            item_strings[items[i]["zone"]] += "<div class=\"wlist-item\"><a href=\"http://www.wowhead.com/item=" + items[i]["id"] +"&bonus=1727:1517\">" + items[i]["slot"] + "</a></div>";
        }
    }
    for (var i = 0, length = zoneids.length; i < length; i++) {
        if (item_strings[i] != "") {
            response_string += "<div class=\"fpanel\"> <h1><span>" + zones[i] +  "</span></h1>" + item_strings[i] + "</div>";
        }
    }
    if (0 === response_string.length) {
        response_string = "You have not items in wishlist, add them in \"Items list\" tab.";
    }
    return response_string;
}

function generateExportString() {
    var export_string = "";
    for (var i = 0, length = items.length; i < length; i++) {
        if (items[i]["inlist"])
            export_string += items[i]["localid"] + ";";
    }
    return export_string;
}

function copyExportString() {
    $("#expstrng").select();
    document.execCommand('copy');
}

function concstructInExpPage() {
    var response_string = "<h2>Export wishlist</h2>";
    response_string += "<textarea id=\"expstrng\" readonly>";
    response_string += generateExportString();
    response_string += "</textarea><br>";
    response_string += "<button class=\"default-button\" onclick=\"copyExportString()\">To clipboard</button><br>";
    response_string += "<h2>Import wishlist</h2><textarea id=\"impstrng\">";
    response_string += "</textarea><br>";
    response_string += "<button class=\"default-button\" onclick=\"updateList(false)\">Add to list</button>";
    response_string += "<button class=\"default-button\" onclick=\"updateList(true)\">Overwrite list</button>";
    return response_string;
}

function updateList(ow_opt) {
    var importstring = $("#impstrng").val();
    var itemids_str = importstring.split(";");
    var itemids = new Set(itemids_str);
    var exportstrng = ""; 
    for (var i = 0, length = items.length; i < length; i++) {
        if (ow_opt) {
            items[i]["inlist"] = false;
        }
        if (itemids.has(items[i]["localid"].toString())) {
            items[i]["inlist"] = true;
            exportstrng += items[i]["localid"] + ";";
        }
    }
    // also update export string
    $("#expstrng").val(exportstrng);
}

function generateFilter(id, groupName, filterName) {
    response_string = "";
    if (id != -1) {
        response_string = "<div><input id=\"" + groupName.toLowerCase() + "filter" + id + "\" type=\"checkbox\" checked>" + filterName + "</div>";
    } else {
        response_string = "<button id=\"" + groupName.toLowerCase() + "filter-all\" onclick=\"filterCheckAll('" + groupName.toLowerCase() + "', " + false + ")\">Uncheck all</button>";
    }
    return response_string;
}

function filterCheckAll(name, check) {
    var length = 0;
    switch(name) {
        case "stats":
        length = stats.length;
        break;
        case "slots":
        length = slots.length;
        break;
        default:
        break;
    }

    for (var i = 0; i < length; i++) {
        $("#" + name + "filter" + i).prop("checked", check);
    }
    $("#" + name + "filter-all").html(check ? "Uncheck all" : "Check all");
    $("#" + name + "filter-all").attr("onclick", "filterCheckAll('" + name + "', " + !check + ")");
}

function constructItemPage() {
    var response_string = "";
    response_string += "<div class=\"fpanel\"><h1><span>Filters</span></h1>";
    response_string += "<div class=\"fpanel\"><h1><span>Search</span></h1><input type=\"text\" value=\"Name or id:<itemid>\"></div>";
    
    response_string += "<div class=\"fpanel\"><h1><span>Stats</span></h1>";
    for (var i = 0, length = stats.length; i < length; i++) {
        response_string += generateFilter(i, "stats", stats[i]);
    }
    response_string += generateFilter(-1, "stats", "All") + "</div>";

    response_string += "<div class=\"fpanel\"><h1><span>Slot</span></h1>";
    for (var i = 0, length = slots.length; i < length; i++) {
        response_string += generateFilter(i, "slots", slots[i]);
    }
    response_string += generateFilter(-1, "slots", "All") + "</div>";

    // zones in constuction

    

    response_string += "<div class=\"fpanel\"><h1><span>Show first</span></h1><select id=\"items_per_page\">";
    response_string += "<option value=\"10\" selected>10</option><option value=\"25\">25</option>";
    response_string += "<option value=\"50\">50</option><option value=\"100\">100</option></select></div>";   
    response_string += "<button class=\"default-button\" onclick=\"presentItemTable()\">Refresh List</button></div>";

    response_string += "</div>";

    response_string += "<div id=\"items_table\"></div>";

    return response_string;
}