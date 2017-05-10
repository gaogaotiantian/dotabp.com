var heroList;
var selfTeam = [];
var enemyTeam = [];
var heroData;
var global_lang = "en-us";

// Input of the function is -1 to 1
// If it's not, it will be saturated
function RateToColor(rate) {
    var colorStr = "rgb("
    if (rate > 1) {
        rate = 1;
    } else if (rate < -1) {
        rate = -1;
    }
    if (rate >= 0) {
        colorStr += Math.round((1-rate)*255).toString();
        colorStr += ",255,";
        colorStr += Math.round((1-rate)*255).toString();
        colorStr += ")"
    } else {
        rate = -rate;
        colorStr += "255,";
        colorStr += Math.round((1-rate)*255).toString();
        colorStr += ",";
        colorStr += Math.round((1-rate)*255).toString();
        colorStr += ")"
    }
    return colorStr;
}
// heroName has to be Valid!
function AddHero(heroName) {
    if (heroName.toLowerCase() != heroName) {
        heroName = HeroLocalToOfficial(heroName);
    }
    var imgSrc = 'http://cdn.dota2.com/apps/dota2/images/heroes/' + heroName.toLowerCase() + '_lg.png';
    html = $("<div>");
    var $hero = $('<div>').attr({"class":"hero", "heroName":heroName, "heroEnName":OfficialToLocal(heroName, "en"), "heroCnName":OfficialToLocal(heroName, "cn")});
    $hero.append($('<img>').attr({"src":imgSrc}));
    var $hero_data=$("<div>").attr({"class":"hero_data", "heroName":heroName, "heroEnName":OfficialToLocal(heroName, "en"), "heroCnName":OfficialToLocal(heroName, "cn")});
    $hero_data.append(GetHeroDataHtml(heroName));
    $hero.append($hero_data);
    html.append($hero);
    return html.html()
}
function GetHeroDataHtml(heroName, heroType = "", lang = global_lang) {
    var html = $("<div>");
    var d = GetHeroData(heroName);
    var team = d[0];
    var opp = -d[1];
    var self_corr = d[2];
    var enemy_corr = d[3];
    var $t = $("<span>");
    var team_color_sat = 255 - Math.min(255, Math.round(Math.abs(team/5*255))).toString();
    var opp_color_sat = 255 - Math.min(255, Math.round(Math.abs(opp/5*255))).toString();
    if (heroType != "enemy") {
        var $d = $("<div>").attr({"class":"dire_hero_data"});
        if (team >= 0) {
            $t.text(text_multi_language[lang]["team_short"] + " +" + team + "%");
            $t.css({"color":"rgb(" +team_color_sat+",255,"+team_color_sat+")"});
        } else {
            $t.text(text_multi_language[lang]["team_short"] + " " + team + "%");
            $t.css({"color":"rgb(255,"+team_color_sat+","+team_color_sat+")"});
        }
        $d.append($t);
        $d.append("<br>");
        $t = $("<span>");
        if (self_corr >= 0) {
            $t.text(text_multi_language[lang]["relative"] + " +" + self_corr + "%");
        } else {
            $t.text(text_multi_language[lang]["relative"] + " " + self_corr + "%");
        }
        $t.css({"color":RateToColor(self_corr/10)});
        $d.append($t);
        $d.append("<br>");
        html.append($d);
    }
    if (heroType != "self") {
        var $d = $('<div>').attr({"class":"radiant_hero_data"});
        $t = $("<span>");
        if (opp > 0) {
            $t.text(text_multi_language[lang]["opp_short"] + " +" + opp + "%");
            $t.css({"color":"rgb(" +opp_color_sat+",255,"+opp_color_sat+")"});
        } else {
            $t.text(text_multi_language[lang]["opp_short"] + " " + opp + "%");
            $t.css({"color":"rgb(255,"+opp_color_sat+","+opp_color_sat+")"});
        }
        $d.append($t);
        $d.append("<br>");
        $t = $("<span>")
        if (enemy_corr > 0) {
            $t.text(text_multi_language[lang]["relative"] + " +" + enemy_corr + "%");
        } else {
            $t.text(text_multi_language[lang]["relative"] + " " + enemy_corr + "%");
        }
        $t.css({"color":RateToColor(enemy_corr/10)});
        $d.append($t)
        html.append($d);
    }
    return html.html()
}
function GetHeroData(heroName) {
    var old_rate = GetWinRate();
    var self_rate = 0;
    var enemy_rate = 0;
    var self_corr = 0;
    var enemy_corr = 0;
    var selfIdx = selfTeam.indexOf(heroName);
    var enemyIdx = enemyTeam.indexOf(heroName);
    // Pretend self choose this hero, if team full, ignore
    if (selfIdx != -1) {
        selfTeam.splice(selfIdx, 1);
        self_rate = old_rate - GetWinRate();
        selfTeam.splice(selfIdx, 0, heroName);
        self_corr = GetCorr(heroName, true);
    } else if (enemyIdx != -1) {
        enemyTeam.splice(enemyIdx, 1);
        enemy_rate = old_rate - GetWinRate();
        enemyTeam.splice(enemyIdx, 0, heroName);
        enemy_corr = GetCorr(heroName, false);
    } else {
        if (selfTeam.length < 5) {
            selfTeam.push(heroName);
            self_rate = GetWinRate() - old_rate;
            selfTeam.pop();
            self_corr = GetCorr(heroName, true);
        }
        if (enemyTeam.length < 5) {
            enemyTeam.push(heroName);
            enemy_rate = GetWinRate() - old_rate;
            enemyTeam.pop();
            enemy_corr = GetCorr(heroName, false);
        }
    }
    return [self_rate.toFixed(2), enemy_rate.toFixed(2), self_corr.toFixed(2), enemy_corr.toFixed(2)]
}
function GetWinRate() {
    var win_self = 1;
    var adv_team = 1;
    var win_enemy = 1;
    var adv_enemy = 1;
    // Calculate self team 
    for (var i = 0; i < selfTeam.length; i++) {
        var name = selfTeam[i];
        win_self = win_self * GetHeroRate(name);
        for (var j = i+1; j < selfTeam.length; j++) {
            if (selfTeam[j] != name)
                win_self = win_self * (GetTeamMate(name, selfTeam[j]));
        }
        for (var j = 0; j < enemyTeam.length; j++) {
            if (enemyTeam[j] != name)
                win_self = win_self * (GetMatchUp(name, enemyTeam[j]));
        }
    }
    for (var i = 0; i < enemyTeam.length; i++) {
        var name = enemyTeam[i];
        win_enemy = win_enemy * GetHeroRate(name);
        for (var j = i+1; j < enemyTeam.length; j++) {
            if (enemyTeam[j] != name)
                win_enemy = win_enemy * (GetTeamMate(name, enemyTeam[j]));
        }
    }
    return (win_self/(win_self+win_enemy)*100).toFixed(2);
}
function GetCorr(heroName, isSelf) {
    var corr = 1;
    for (var i = 0; i < selfTeam.length; i++) {
        if (selfTeam[i] != heroName) {
            if (isSelf) {
                corr = corr * GetTeamMate(heroName, selfTeam[i]);
            } else {
                corr = corr * GetMatchUp(heroName, selfTeam[i]);
            }
        }
    }

    for (var i = 0; i < enemyTeam.length; i++) {
        if (enemyTeam[i] != heroName) {
            if (isSelf) {
                corr = corr * GetMatchUp(heroName, enemyTeam[i]);
            } else {
                corr = corr * GetTeamMate(heroName, enemyTeam[i]);
            }
        }
    }
    return 100*(corr-1);
}
// Win rate calculation functions
function GetMatchUp(heroName1, heroName2) {
    if (heroData && heroName1 != heroName2) {
        return heroData[heroName1]["matchup"][heroName2];
    }
    return 1;
}
function GetTeamMate(heroName1, heroName2) {
    if (heroData && heroName1 != heroName2) {
        return heroData[heroName1]["teammate"][heroName2];
    }
    return 1;
}
function GetHeroRate(heroName) {
    if (heroData) {
        return heroData[heroName]["rate"];
    }
    return 1;
}
function HeroLocalToOfficial(localName) {
    if (localName == "") {
        return "";
    }
    for (var i = 0; i < heroList.length; i++) {
        if (heroList[i]["localized_name"] == localName) {
            return heroList[i]["name"];
        } 
    }
    alert("There's no hero named "+localName);
}
function OfficialToLocal(officialName, lang="en") {
    if (officialName == "") {
        return "";
    }
    for (var i = 0; i < heroList.length; i++) {
        if (heroList[i]["name"] == officialName) {
            if (lang == "en") {
                return heroList[i]["localized_name"];
            } else if (lang == "cn") {
                return heroList[i]["localized_name_cn"];
            }
        }
    }
    alert("There's no hero named "+officialName);
}
function RefreshPage() {
    $('#on_stage_hero_self_div').empty();
    $('#on_stage_hero_enemy_div').empty();
    for (i = 0; i < 5; i++) {
        if (i < selfTeam.length) {
            $('#on_stage_hero_self_div').append($("<div>", {"class":"col on_stage_hero self_on_stage_hero"}).append(AddHero(selfTeam[i])));
        } else {
            $('#on_stage_hero_self_div').append($("<div>", {"class":"col on_stage_hero self_on_stage_hero"}));
        }
        if (i < enemyTeam.length) {
            $('#on_stage_hero_enemy_div').append($("<div>", {"class":"col on_stage_hero enemy_on_stage_hero"}).append(AddHero(enemyTeam[i])));
        } else {
            $('#on_stage_hero_enemy_div').append($("<div>", {"class":"col on_stage_hero enemy_on_stage_hero"}));
        }
    }
    // Update win rate here
    $('#win_rate_val').text(GetWinRate().toString() + "%");

    // Refresh hero rate
    $(".hero_data").each(function() {
        if ($(this).parent().parent().hasClass("self_on_stage_hero")) {
            $(this).html(GetHeroDataHtml($(this).attr("heroName"), "self"));
        } else if ($(this).parent().parent().hasClass("enemy_on_stage_hero")) {
            $(this).html(GetHeroDataHtml($(this).attr("heroName"), "enemy"));
        } else {
            $(this).html(GetHeroDataHtml($(this).attr("heroName")));
        }
    });
}

function ReorderHeros(language) {
    if (language == "zh-cn") {
        var lineMax = 21;
        var heroStr = ['Elder Titan', 'Undying', 'Abaddon', 'Timbersaw', 'Omniknight', 'Beastmaster', 'Legion Commander', 'Wraith King', 'Phoenix', 'Centaur Warrunner', 'Clockwerk', 'Huskar', 'Lifestealer', 'Earth Spirit', 'Underlord', 'Tiny', 'Tusk', 'Pudge', 'Earthshaker', 'Axe', 'Slardar', 'Sven', 'Kunkka', 'Night Stalker', 'Doom', 'Treant Protector', 'Sand King', 'Chaos Knight', 'Tidehunter', 'Alchemist', 'Lycan', 'Io', 'Spirit Breaker', 'Brewmaster', 'Bristleback', 'Magnus', 'Dragon Knight'];
        var heroAgi = ['Juggernaut', 'Clinkz', 'Viper', 'Razor', 'Venomancer', 'Riki', 'Drow Ranger', 'Morphling', 'Nyx Assassin', 'Bloodseeker', 'Templar Assassin', 'Vengeful Spirit', 'Arc Warden', 'Naga Siren', 'Troll Warlord', 'Phantom Assassin', 'Phantom Lancer', 'Spectre', 'Shadow Fiend', 'Lone Druid', 'Terrorblade', 'Anti-Mage', 'Slark', 'Ember Spirit', 'Ursa', 'Sniper', 'Gyrocopter', 'Mirana', 'Meepo', 'Weaver', 'Medusa', 'Broodmother', 'Faceless Void', 'Bounty Hunter', 'Luna', 'Monkey King'];
        var heroInt = ['Tinker', "Nature's Prophet", 'Keeper of the Light', 'Skywrath Mage', 'Zeus', 'Winter Wyvern', 'Techies', 'Witch Doctor', 'Lich', 'Puck', 'Pugna', 'Disruptor', 'Dazzle', 'Leshrac', 'Rubick', 'Shadow Demon', 'Shadow Shaman', 'Warlock', 'Jakiro', 'Death Prophet', 'Outworld Devourer', 'Crystal Maiden', 'Silencer', 'Queen of Pain', 'Necrophos', 'Invoker', 'Oracle', 'Bane', 'Visage', 'Lina', 'Lion', 'Batrider', 'Enigma', 'Chen', 'Storm Spirit', 'Windranger', 'Ogre Magi', 'Enchantress', 'Dark Seer'];
    } else {
        var lineMax = 20;
        var heroStr = ['Abaddon', 'Alchemist', 'Axe', 'Beastmaster', 'Brewmaster', 'Bristleback', 'Centaur Warrunner', 'Chaos Knight', 'Clockwerk', 'Doom', 'Dragon Knight', 'Earth Spirit', 'Earthshaker', 'Elder Titan', 'Huskar', 'Io', 'Kunkka', 'Legion Commander', 'Lifestealer', 'Lycan', 'Magnus', 'Night Stalker', 'Omniknight', 'Phoenix', 'Pudge', 'Sand King', 'Slardar', 'Spirit Breaker', 'Sven', 'Tidehunter', 'Timbersaw', 'Tiny', 'Treant Protector', 'Tusk', 'Underlord', 'Undying', 'Wraith King'];
        var heroAgi = ['Anti-Mage', 'Arc Warden', 'Bloodseeker', 'Bounty Hunter', 'Broodmother', 'Clinkz', 'Drow Ranger', 'Ember Spirit', 'Faceless Void', 'Gyrocopter', 'Juggernaut', 'Lone Druid', 'Luna', 'Medusa', 'Meepo', 'Mirana', 'Monkey King', 'Morphling', 'Naga Siren', 'Nyx Assassin', 'Phantom Assassin', 'Phantom Lancer', 'Razor', 'Riki', 'Shadow Fiend', 'Slark', 'Sniper', 'Spectre', 'Templar Assassin', 'Terrorblade', 'Troll Warlord', 'Ursa', 'Vengeful Spirit', 'Venomancer', 'Viper', 'Weaver'];
        var heroInt = ['Ancient Apparition', 'Bane', 'Batrider', 'Chen', 'Crystal Maiden', 'Dark Seer', 'Dazzle', 'Death Prophet', 'Disruptor', 'Enchantress', 'Enigma', 'Invoker', 'Jakiro', 'Keeper of the Light', 'Leshrac', 'Lich', 'Lina', 'Lion', "Nature's Prophet", 'Necrophos', 'Ogre Magi', 'Oracle', 'Outworld Devourer', 'Puck', 'Pugna', 'Queen of Pain', 'Rubick', 'Shadow Demon', 'Shadow Shaman', 'Silencer', 'Skywrath Mage', 'Storm Spirit', 'Techies', 'Tinker', 'Visage', 'Warlock', 'Windranger', 'Winter Wyvern', 'Witch Doctor', 'Zeus'];
    }
    $(".off_stage_hero_div").empty();
    for (var i = 0; i < lineMax; i++) {
        $('#off_stage_hero_div_str_1').append($("<div>", {"class":"col off_stage_hero"}).append(AddHero(HeroLocalToOfficial(heroStr[i]))));
        $('#off_stage_hero_div_agi_1').append($("<div>", {"class":"col off_stage_hero"}).append(AddHero(HeroLocalToOfficial(heroAgi[i]))));
        $('#off_stage_hero_div_int_1').append($("<div>", {"class":"col off_stage_hero"}).append(AddHero(HeroLocalToOfficial(heroInt[i]))));
        if (i +lineMax < heroStr.length) {
            $('#off_stage_hero_div_str_2').append($("<div>", {"class":"col off_stage_hero"}).append(AddHero(HeroLocalToOfficial(heroStr[i+lineMax]))));
        } else {
            $('#off_stage_hero_div_str_2').append($("<div>", {"class":"col off_stage_hero"}));
        }
        if (i +lineMax < heroAgi.length) {
            $('#off_stage_hero_div_agi_2').append($("<div>", {"class":"col off_stage_hero"}).append(AddHero(HeroLocalToOfficial(heroAgi[i+lineMax]))));
        } else {
            $('#off_stage_hero_div_agi_2').append($("<div>", {"class":"col off_stage_hero"}));
        }
        if (i + lineMax < heroInt.length) {
            $('#off_stage_hero_div_int_2').append($("<div>", {"class":"col off_stage_hero"}).append(AddHero(HeroLocalToOfficial(heroInt[i+lineMax]))));
        } else {
            $('#off_stage_hero_div_int_2').append($("<div>", {"class":"col off_stage_hero"}));
        }
    }
}
function ReplaceText(language) {
    if (language == "zh-cn") {
        var key = 'zh-cn';
    } else {
        var key = 'en-us';
    }
    $(".multi_language").each(function() {
        $(this).text(text_multi_language[key][$(this).attr("id")]);
    })
}
function ChangeLanguage(language) {
    if (language == "zh-cn") {
        global_lang = "zh-cn";
    } else {
        global_lang = "en-us";
    }
    ReplaceText(language);
    ReorderHeros(language);
    RefreshPage();
}
function GetLanguage() {
    curLang = navigator.language;
    if (!curLang) {
        curLang = navigator.browserLanguage;
    }
    return curLang;
}
$(document).ready(function() {
    // Read all json data
    $.getJSON("hero_list.json", function(data) {
        // Deep copy here
        heroList = JSON.parse(JSON.stringify(data["heroes"]));
    })
    .done(function() {
        var lang = GetLanguage().toLowerCase();
        if (lang == "zh-cn") {
            $("#language_select").val("Chinese");
        } else {
            $("#language_select").val("English");
        }
        ChangeLanguage(lang);
    });

    $.getJSON("hero_data.json", function(data) {
        heroData = JSON.parse(JSON.stringify(data));
        $("#footer_small").html('Copyright &copy; 2017, <a href="mailto:gaogaotiantian@hotmail.com">Tian Gao</a> | Last time database updated: ' + heroData["updateTime"]);
    })
    .done(function() {
        RefreshPage();
    });
    // Setup the on stage slots
    $('body')
    .on('click', 'img', function(e) {
        if ($(this).parent().parent().hasClass("self_on_stage_hero")) {
            var name = $(this).parent().attr("heroName");
            selfTeam.splice(selfTeam.indexOf(name), 1);
        } else if ($(this).parent().parent().hasClass("enemy_on_stage_hero")) {
            var name = $(this).parent().attr("heroName");
            enemyTeam.splice(enemyTeam.indexOf(name), 1);
        } else if ($(this).parent().parent().hasClass("off_stage_hero")) {
            var name = $(this).parent().attr("heroName");
            if (selfTeam.indexOf(name) == -1 && enemyTeam.indexOf(name) == -1) {
                if (e.offsetX < e.target.width/2 && selfTeam.length < 5) {
                    selfTeam.push(name);
                } else if (e.offsetX >= e.target.width/2 && enemyTeam.length < 5){
                    enemyTeam.push(name);
                }
            }
        }
        RefreshPage()
    })
    .on('mousemove', 'img', function(e) {
        var name = $(this).parent().attr("heroname");
        if ($(this).parent().parent().hasClass("off_stage_hero")) {
            if (e.offsetX < e.target.width/2) {
                $(".self_on_stage_hero").each(function() {
                    $(this).find("img").css({"border-color":RateToColor((GetTeamMate(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
                });
                $(".enemy_on_stage_hero").each(function() {
                    $(this).find("img").css({"border-color":RateToColor((GetMatchUp(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
                });
                $(this).css({"border-color":"green"});
            } else {
                $(".enemy_on_stage_hero").each(function() {
                    $(this).find("img").css({"border-color":RateToColor((GetTeamMate(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
                });
                $(".self_on_stage_hero").each(function() {
                    $(this).find("img").css({"border-color":RateToColor((GetMatchUp(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
                });
                $(this).css({"border-color":"red"});
            }
        } else if ($(this).parent().parent().hasClass("self_on_stage_hero")) {
            $(".self_on_stage_hero").each(function() {
                $(this).find("img").css({"border-color":RateToColor((GetTeamMate(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
            });
            $(".enemy_on_stage_hero").each(function() {
                $(this).find("img").css({"border-color":RateToColor((GetMatchUp(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
            });
        } else if ($(this).parent().parent().hasClass("enemy_on_stage_hero")) {
            $(".enemy_on_stage_hero").each(function() {
                $(this).find("img").css({"border-color":RateToColor((GetTeamMate(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
            });
            $(".self_on_stage_hero").each(function() {
                $(this).find("img").css({"border-color":RateToColor((GetMatchUp(name, $(this).find(".hero").attr("heroname")) - 1)/0.05)});
            });
        }
    })
    .on('mouseleave', 'img', function(e) {
        $(this).css({"border-color":"transparent"});
        $(".on_stage_hero").find("img").css({"border-color":"transparent"});
    })
    .on('change', '#language_select', function(e) {
        if ($(this).val() == "English") {
            ChangeLanguage("en-us");
        } else if ($(this).val() == "Chinese") {
            ChangeLanguage("zh-cn");
        }
    })
    .on('input', '#hero_search', function(e) {
        var keyWord = $(this).val().toLowerCase();
        $('.off_stage_hero').each(function() {
            if ($(this).find(".hero").length != 0) {
                if ($(this).find(".hero").attr("heroEnName").toLowerCase().indexOf(keyWord) == -1 && 
                    $(this).find(".hero").attr("heroCnName").indexOf(keyWord) == -1) {
                    $(this).css({"opacity":0.2});
                } else {
                    $(this).css({"opacity":1});
                }
            }
        });
    })
    ;
});
