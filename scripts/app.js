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
    "Return to Karazhan"
];

//var zone_itemschosen = [0, 0, 0, 0, 0, 0, 0, 0, 0, 0];
var settings = 
{
    "items_per_page": 10,
    "filters": []
}

var columns = ["name", "slot", "crit", "haste", "mastery", "versatility", "zone", "inlist"];
var orders = [false, false, false, false, false, false, false, false];

var currentpage = -1; // 0 - items, 1 - instances

var items = [];
//var processedRequests = zoneids.length;

function handleRequest() {
    if (!--processedRequests) {
        sortByColumn('name', 0);
        presentItemTable(1);
    }
}

$(document).ready(function() {
    /*for (var i = 0; i < zoneids.length; i++) {
        $.ajax({
            type: 'GET',
            url: "/data/zone" + zoneids[i] + ".json",
            dataType: 'json',
            success: function(data) {
                var defer = $.Deferred();
                items = items.concat(data);
                handleRequest();
                defer.resolve();
            }
        });
    }*/
    $.ajax({
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
    });
});

function presentItemTable() {
    var items_to_show = $("#items_per_page").val();
    var items_table = "<table class=\"default-table\">";
    items_table += "<tr><th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(0)\">Item</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(1)\">Slot</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(2)\">Crit</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(3)\">Haste</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(4)\">Mastery</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(5)\">Versatility</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(6)\">Instance</button></th>";
    items_table += "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(7)\">In list</button></th>";
    items_table += "</tr>";
    var show_crit = $('#filter0').prop("checked");
    var show_haste = $('#filter1').prop("checked");
    var show_mastery = $('#filter2').prop("checked");
    var show_versatility = $('#filter3').prop("checked");
    var shown_items = 0;
    var total_items = items.length;
    for (var i = 0; i < total_items; i++) {
        if ((show_crit && items[i]["crit"] > 0) ||
            (show_haste && items[i]["haste"] > 0) ||
            (show_mastery && items[i]["mastery"] > 0) ||
            (show_versatility && items[i]["versatility"])) {
            items_table += "<tr><td>" + items[i]["name"] + "</td><td>" + items[i]["slot"] + "</td>";
            items_table += "<td>" + items[i]["crit"] + "</td><td>" + items[i]["haste"] + "</td><td>" + items[i]["mastery"] + "</td><td>" + items[i]["versatility"] + "</td>";
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
        for (var i = 0; i < 27; i++) {
            settings["filters"][i] = $("#filter" + i).prop("checked");
        }
        settings["items_per_page"] = $("#items_per_page").val();
    }
}

function loadSettings() {
    for (var i = 0; i < 27; i++) {
        $("#filter" + i).prop("checked", settings["filters"][i]);
    }
    $("#items_per_page").val("" + settings["items_per_page"]).change();
}

function loadItemPage() {
    if (currentpage != 0) {
        $("#page-content").load("/contents/itemlist.html", function() {
            loadSettings();
            currentpage = 0;
            presentItemTable();
        });     
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