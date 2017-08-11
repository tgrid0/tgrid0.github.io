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
var types = ["Cloth", "Leather", "Mail", "Plate", "Misc"];
var titles = ["Filters", "Search", "Stats", "Slot", "Type", "Item level", "Show first", "Show raw stat percents", "Item", "Instance", "In list"];
var strictTypes = ["cloth", "leather", "mail", "plate", "misc"];
var strictSlots = ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket"];

var settings =
{
    "items_per_page": 10,
    "statsfilters": [],
    "slotsfilters": [],
    "typesfilters": []
}

var stat_ratings = {"crit" : 400, "haste" : 375, "mastery" : 400, "versatility": 475};

var strictColumns = ["name", "slot", "type", "crit", "haste", "mastery", "versatility", "zone", "inlist"];
var orders = [false, false, false, false, false, false, false, false, false];
var locales = {"en": 0, "ru": 1, "de": 2, "fr": 3};
var localizedTitles =
{
    "en": ["Filters", "Search", "Stats", "Slot", "Type", "Item level", "Show first", "Show raw stat percents", "Refresh Table", "Item", "Instance", "In list", "Add", "Remove", "Total stats"],
    "ru": ["Фильтры", "Поиск", "Характеристики", "Слот", "Тип", "Уровень предметов", "Показывать первые", "Показывать проценты", "Обновить таблицу", "Предмет", "Зона", "В листе", "Добавить", "Убрать", "Итого характеристик"],
    "de": ["Filters", "Search", "Stats", "Slot", "Type", "Item level", "Show first", "Show raw stat percents", "Refresh Table", "Item", "Instance", "In list", "Add", "Remove", "Total stats"],
    "fr": ["Filters", "Search", "Stats", "Slot", "Type", "Item level", "Show first", "Show raw stat percents", "Refresh Table", "Item", "Instance", "In list", "Add", "Remove", "Total stats"]
}
var localizedStats =
{
    "en": ["Crit", "Haste", "Mastery", "Versatility"],
    "ru": ["Крит", "Скорость", "Искусность", "Универсальность"],
    "de": ["Crit", "Haste", "Mastery", "Versatility"],
    "fr": ["Crit", "Haste", "Mastery", "Versatility"]
}
var localizedSlots =
{
    "en": ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket"],
    "ru": ["Голова", "Шея", "Плечо", "Спина", "Грудь", "Запястья", "Руки", "Пояс", "Ноги", "Ступни", "Палец", "Аксессуар"],
    "de": ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket"],
    "fr": ["Head", "Neck", "Shoulder", "Back", "Chest", "Wrist", "Hands", "Waist", "Legs", "Feet", "Finger", "Trinket"]
}
var localizedTypes =
{
    "en": ["Cloth", "Leather", "Mail", "Plate", "Misc"],
    "ru": ["Ткань", "Кожа", "Кольчуга", "Латы", "Прочее"],
    "de": ["Cloth", "Leather", "Mail", "Plate", "Misc"],
    "fr": ["Cloth", "Leather", "Mail", "Plate", "Misc"]
}
var locdata = [];

var currentlocale = "en";
var currentpage = -1; // 0 - items, 1 - instances

var items = [];
var processedRequests = zoneids.length;

function changeLocale(loc) {
    setLocale(loc);
    refreshPage();
}

function setLocale(loc) {
    currentlocale = loc;
    items.forEach(function(item, i, items) {
        item["name"] = locdata[locales[currentlocale]][item["id"]];
    });
    stats = localizedStats[currentlocale];
    slots = localizedSlots[currentlocale];
    types = localizedTypes[currentlocale];
    titles = localizedTitles[currentlocale];
    Object.keys(locales).forEach(function(key) {
        $("#loc" + key).removeClass("default-button-active");
    });
    $("#loc" + currentlocale).addClass("default-button-active");
}

function handleRequest() {
    if (!--processedRequests) {
        $.ajax({
            type: 'GET',
            url: "/locale/locale.json",
            dataType: 'json',
            success: function(data) {
                locdata = locdata.concat(data);
                setLocale(currentlocale);
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
                  item["inlist"] = -1;
                });
                items = items.concat(data);
                handleRequest();
                defer.resolve();
            }
        });
    }
});

function generateTableButton(columnId, name) {
    return "<th><button class=\"default-button\" style=\"width: 100%\" onclick=\"sortByColumn(" + columnId + ")\">" + name + "</button></th>";
}

function passStatFilters(item) {
    var show_crit = $('#statsfilter0').prop("checked");
    var show_haste = $('#statsfilter1').prop("checked");
    var show_mastery = $('#statsfilter2').prop("checked");
    var show_versatility = $('#statsfilter3').prop("checked");
    return (show_crit && item["crit"][0] > 0) ||
            (show_haste && item["haste"][0] > 0) ||
            (show_mastery && item["mastery"][0] > 0) ||
            (show_versatility && item["versatility"][0]);
}

function passSlotFilters(item) {
    var i = 0;
    var length = strictSlots.length;
    while (i < length) {
        if (strictSlots[i].toLowerCase() == item["slot"])
            break;
        i++;
    }
    return $('#slotsfilter' + i).prop("checked");
}

function passTypeFilters(item) {
    var i = 0;
    var length = strictTypes.length;
    while (i < length) {
        if (strictTypes[i].toLowerCase() == item["type"])
            break;
        i++;
    }
    return $('#typesfilter' + i).prop("checked");
}

function getItemStat(item, statname, ilvl, showperc) {
    if (item[statname][ilvl] > 0)
        return item[statname][ilvl] + (showperc ? "<br>" + (item[statname][ilvl]/stat_ratings[statname]).toFixed(2) + "%" : "");
    return "-";
}

function presentItemTable() {
    var items_to_show = $("#items_per_page").val();
    var showperc = $("#showperc").prop("checked");
    var chosen_ilvl = $("#chosen_ilvl").val();
    var items_table = "<table class=\"default-table\">";
    items_table += "<tr>";
    items_table += generateTableButton(0, titles[9]);
    items_table += generateTableButton(1, titles[3]);
    items_table += generateTableButton(2, titles[4]);
    items_table += generateTableButton(3, stats[0]);
    items_table += generateTableButton(4, stats[1]);
    items_table += generateTableButton(5, stats[2]);
    items_table += generateTableButton(6, stats[3]);
    items_table += generateTableButton(7, titles[10]);
    items_table += generateTableButton(8, titles[11]);
    items_table += "</tr>";

    var shown_items = 0;
    var total_items = items.length;
    for (var i = 0; i < total_items; i++) {
        if (passStatFilters(items[i]) && passSlotFilters(items[i]) && passTypeFilters(items[i])) {
            items_table += "<tr><td>" + items[i]["name"] + "</td><td>" + items[i]["slot"] + "</td><td>" + items[i]["type"] + "</td>";
            items_table += "<td>" + getItemStat(items[i], "crit", chosen_ilvl, showperc) +
                            "</td><td>" + getItemStat(items[i], "haste", chosen_ilvl, showperc) +
                            "</td><td>" + getItemStat(items[i], "mastery", chosen_ilvl, showperc) +
                            "</td><td>" + getItemStat(items[i], "versatility", chosen_ilvl, showperc) +
                            "</td>";
            items_table += "<td>" + zones[items[i]["zone"]] + "</td>";
            items_table += "<td><button id=\"t_list_check" + i + "\" onclick=\"setInList(" + i + ")\" class=\"default-button\" style=\"width: 100%;" + (items[i]["inlist"] > -1 ? "background-color:green;\">" + titles[13] : "\">" + titles[12]) + "</button></td></tr>";
            shown_items++;
        }
        if (shown_items >= items_to_show)
            break;
    }
    items_table += "</table>";
    $('#items_table').html(items_table);
}

function sortByColumn(co) {
    var chosen_ilvl = $("#chosen_ilvl").val();
    if (orders[co])
    {
        if (co > 2 && co < 7)
            items.sort(function(a, b) {
                return a[strictColumns[co]][chosen_ilvl] < b[strictColumns[co]][chosen_ilvl];
            });
        else
            items.sort(function(a, b) {
                return a[strictColumns[co]] < b[strictColumns[co]];
            });
    } else {
        if (co > 2 && co < 7)
            items.sort(function(a, b) {
                return a[strictColumns[co]][chosen_ilvl] > b[strictColumns[co]][chosen_ilvl];
            });
        else
            items.sort(function(a, b) {
                return a[strictColumns[co]] > b[strictColumns[co]];
            });
    }
    orders[co] = !orders[co];
    presentItemTable();
}

function setInList(index) {
    var chosen_ilvl = $("#chosen_ilvl").val();
    items[index]["inlist"] = items[index]["inlist"] > -1 ? -1 : chosen_ilvl;
    var b = items[index]["inlist"] > -1;
    $("#t_list_check" + index).css("background-color", b ? "green" : "#154aa5");
    $("#t_list_check" + index).html(b ? titles[13] : titles[12]);
}

function saveSettings() {
    if (currentpage == 0) {
        for (var i = 0, length = stats.length; i < length; i++) {
            settings["statsfilters"][i] = $("#statsfilter" + i).prop("checked");
        }
        for (var i = 0, length = slots.length; i < length; i++) {
            settings["slotsfilters"][i] = $("#slotsfilter" + i).prop("checked");
        }
        for (var i = 0, length = types.length; i < length; i++) {
            settings["typesfilters"][i] = $("#typesfilter" + i).prop("checked");
        }
        settings["items_per_page"] = $("#items_per_page").val();
        settings["showperc"] = $("#showperc").prop("checked");
    }
}

function loadSettings() {
    for (var i = 0, length = stats.length; i < length; i++) {
        $("#statsfilter" + i).prop("checked", settings["statsfilters"][i]);
    }
    for (var i = 0, length = slots.length; i < length; i++) {
        $("#slotsfilter" + i).prop("checked", settings["slotsfilters"][i]);
    }
    for (var i = 0, length = types.length; i < length; i++) {
        $("#typesfilter" + i).prop("checked", settings["typesfilters"][i]);
    }
    $("#items_per_page").val("" + settings["items_per_page"]).change();
    $("#showperc").prop("checked", settings["showperc"]);
}

function refreshPage() {
    switch(currentpage) {
        case 0:
        $("#page-content").html(constructItemPage());
        presentItemTable();
        break;
        case 1:
        $("#page-content").html(constructWishList());
        break;
        case 2:
        $("#page-content").html(concstructInExpPage());
        break;
    }
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

var levels = [0, 2, 4, 6, 8, 10, 12, 13, 14, 15];

function ilvlBonusId(ind) {
    return 1517 + (ind * 5);
}

function constructWishList() {
    var response_string = "";
    var item_strings = [];
    var zoneshow = [];
    var total_crit = 0;
    var total_haste = 0;
    var total_mastery = 0;
    var total_versatility = 0;
    for (var i = 0, length = zoneids.length; i < length; i++) {
        item_strings[i] = [];
        for (var j = 0; j < 10; j++)
            item_strings[i][j] = "";
    }
    for (var i = 0, length = zoneids.length; i < length; i++) {
        zoneshow[i] = false;
    }
    for (var i = 0, length = items.length; i < length; i++) {
        if (items[i]["inlist"] > -1) {
            item_strings[items[i]["zone"]][items[i]["inlist"]] += "<div class=\"wlist-item\"><a href=\"http://www.wowhead.com/item=" + items[i]["id"] +
                                                                  "&bonus=1727:" + ilvlBonusId(items[i]["inlist"]) + "\">" + items[i]["slot"] + "</a></div>";
            zoneshow[items[i]["zone"]] = true;
            total_versatility += items[i]["versatility"][items[i]["inlist"]];
            total_crit += items[i]["crit"][items[i]["inlist"]];
            total_mastery += items[i]["mastery"][items[i]["inlist"]];
            total_haste += items[i]["haste"][items[i]["inlist"]];
        }
    }
    response_string += "<div class=\"fpanel\"> <h1><span>" + titles[14] + "</span></h1>";
    response_string += stats[0] + " " + total_crit + " (" + (total_crit/stat_ratings["crit"]).toFixed(2) + "%) &nbsp &nbsp";
    response_string += stats[1] + " " + total_haste + " (" + (total_haste/stat_ratings["haste"]).toFixed(2) + "%) &nbsp &nbsp";
    response_string += stats[2] + " " + total_mastery + " (" + (total_mastery/stat_ratings["mastery"]).toFixed(2) + "%) &nbsp &nbsp";
    response_string += stats[3] + " " + total_versatility + " (" + (total_versatility/stat_ratings["versatility"]).toFixed(2) + "%) </div>";
    for (var i = 0, length = zoneids.length; i < length; i++) {
        if (zoneshow[i]) {
            response_string += "<div class=\"fpanel\"> <h1><span>" + zones[i] +  "</span></h1>";
            for (var j = 0; j < 10; j++) {
                if (item_strings[i][j] != "" && item_strings[i][j] != undefined)
                    response_string += "<div>" + levels[j] +  "+ &nbsp &nbsp" + item_strings[i][j] + "</div>";
            }
            response_string += "</div>";
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
        if (items[i]["inlist"] > -1)
            export_string += items[i]["localid"] + ":" + items[i]["inlist"] + ";";
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
    var impItems = {}
    for (var i = 0, length = itemids_str.length; i < length; i++) {
        impItems[itemids_str[i].split(":")[0]] = itemids_str[i].split(":")[1];
    }
    var exportstrng = "";
    for (var i = 0, length = items.length; i < length; i++) {
        if (ow_opt) {
            items[i]["inlist"] = -1;
        }
        if (items[i]["inlist"] > -1 && items[i]["localid"].toString() in impItems) {
            items[i]["inlist"] = parseInt(impItems[items[i]["localid"].toString()]);
            exportstrng += items[i]["localid"] + ":" + items[i]["inlist"] + ";";
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
    response_string += "<div class=\"fpanel\"><h1><span>" + titles[0] + "</span></h1>";
    response_string += "<div class=\"fpanel\"><h1><span>" + titles[1] + "</span></h1><input type=\"text\" value=\"Name or id:<itemid>\"></div>";

    response_string += "<div class=\"fpanel\"><h1><span>" + titles[2] + "</span></h1>";
    for (var i = 0, length = stats.length; i < length; i++) {
        response_string += generateFilter(i, "stats", stats[i]);
    }
    response_string += generateFilter(-1, "stats", "All") + "</div>";

    response_string += "<div class=\"fpanel\"><h1><span>" + titles[3] + "</span></h1>";
    for (var i = 0, length = slots.length; i < length; i++) {
        response_string += generateFilter(i, "slots", slots[i]);
    }
    response_string += generateFilter(-1, "slots", "All") + "</div>";

    response_string += "<div class=\"fpanel\"><h1><span>" + titles[4] + "</span></h1>";
    for (var i = 0, length = types.length; i < length; i++) {
        response_string += generateFilter(i, "types", types[i]);
    }
    response_string += generateFilter(-1, "types", "All") + "</div>";

    // zones in constuction

    response_string += "<div class=\"fpanel\"><h1><span>" + titles[5] + "</span></h1><select id=\"chosen_ilvl\">";
    for (var i = 0; i < 10; i++) {
        response_string += "<option value=\"" + i +"\" selected>" + (865 + i * 5) +"</option>";
    }
    response_string += "</select></div>";

    response_string += "<div class=\"fpanel\"><h1><span>" + titles[6] + "</span></h1><select id=\"items_per_page\">";
    response_string += "<option value=\"10\" selected>10</option><option value=\"25\">25</option>";
    response_string += "<option value=\"50\">50</option><option value=\"100\">100</option></select></div>";

    response_string += "<div class=\"fpanel\"><h1><span>" + titles[7] + "</span></h1><input type=\"checkbox\" id=\"showperc\" >Note: percents show without any bonuses, taken from <a href=\"http://www.wowhead.com/secondary-stat-changes-in-patch-7-1-5\">article</a>.</div>";

    response_string += "<button class=\"default-button\" onclick=\"presentItemTable()\">" + titles[8] + "</button></div>";

    response_string += "</div>";

    response_string += "<div id=\"items_table\"></div>";

    return response_string;
}