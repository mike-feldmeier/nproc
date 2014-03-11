var listCache = {};

$(document).ready(function() {
  refreshList();
  setInterval(refreshList, 10000);
  setInterval(refreshDetail, 2000);
  initializeAddLink();
});

function refreshList() {
  $.get("/services")
    .done(function(services) {
      console.log("Received list: " + JSON.stringify(services));
      added(listCache, services, addServiceToList);
      changed(listCache, services, updateServiceInList);
      removed(listCache, services, removeServiceFromList);

      listCache = services;
    });
}

function refreshDetail() {
  var currentId = $("#detail").attr("data-id");
  if(currentId != null) {
    showDetail(currentId);
  }
}

function addServiceToList(header) {
  console.log("Adding service [" + header.name + "] to list");

  // Get a copy of the element template...
  var elem = $("#list .service.template").clone();
  elem.removeClass("template");

  // Fill details...
  if(header != null) {
    setListItem(header, elem);
  }

  // Set up header click handler to display detail view...
  $(".header", elem).click(function(e) {
    showDetail(header.id);
  });

  // Set up button click handler to start / stop the service...
  $("a.state", elem).click(function(e) {
    e.preventDefault();
    var serviceElem = $(e.target).parent().parent();
    if(serviceElem.hasClass("running")) {
      stop(serviceElem.data("id"));
    }
    else {
      start(serviceElem.data("id"));
    }
  });

  // Set up a button click handler to display the menu...
  $("a.menu", elem).click(function(e) {
    e.preventDefault();
    e.stopPropagation();
    var wasVisible = $(".popup-menu", elem).is(":visible");
    $("#list .popup-menu").slideUp();
    if(!wasVisible) {
      $(".popup-menu", elem).slideDown();
    }
  });

  // Set up a button click handler to delete the service...
  $("a.delete", elem).click(function(e) {
    e.preventDefault();

    $.ajax({
      url: "/services/" + elem.attr("data-id"),
      type: "delete"
    })
    .done(function() {
      elem.parents("li")[0].remove();
    })
    .error(function(xhr, err, thrown) {
      alert(err + ": " + thrown);
    });
  });

  // Set up a button click handler to save the service information changes...
  $("a.save", elem).click(function(e) {
    e.preventDefault();

    var data = {
      id: elem.attr("data-id"),
      name: $(".popup-menu input[name='name']", elem).val(),
      cwd: $(".popup-menu input[name='cwd']", elem).val(),
      cmdline: $(".popup-menu input[name='cmd']", elem).val()
    };

    $.ajax({
      url: "/services/" + data.id + "/header",
      type: "put",
      data: data
    })
    .done(function() {
      $(".header .name", elem).text(data.name);

      saveOriginal($(".popup-menu input[name='name']", elem));
      saveOriginal($(".popup-menu input[name='cwd']", elem));
      saveOriginal($(".popup-menu input[name='cmd']", elem));

      $(".popup-menu", elem).slideUp();
    })
    .error(function(xhr, err, thrown) {
      alert(err + ": " + thrown);
    });
  });

  // Set up a button click handler to cancel the service information changes...
  $("a.cancel", elem).click(function(e) {
    e.preventDefault();

    resetToOriginal($(".popup-menu input[name='name']", elem));
    resetToOriginal($(".popup-menu input[name='cwd']", elem));
    resetToOriginal($(".popup-menu input[name='cmd']", elem));

    $(e.target).parents(".popup-menu").slideUp();
  });

  // Add element to the list...
  $("#list ul").append("<li>").append(elem);
}

function resetToOriginal(elem) {
  elem.val(elem.attr("data-original"));
}

function saveOriginal(elem) {
  elem.attr("data-original", elem.val());
}

function updateServiceInList(previous, next) {
  console.log("Updating service [" + previous.name + "] in list");

  var elem = $("#list .service[data-id=" + previous.id + "]");

  setListItem(next, elem);
}

function removeServiceFromList(header) {
  console.log("Removing service [" + header.name + "] from list");

  var elem = $("#list .service[data-id=" + header.id + "]");

  elem.remove();
}

function setListItem(header, elem) {
  elem.toggleClass("running", header.running);
  $("a.state", elem).text(elem.hasClass("running") ? "Stop" : "Start");

  elem.attr("data-id", header.id);
  $(".name", elem).text(header.name);

  $(".popup-menu input[name='name']", elem).attr("data-original", header.name).val(header.name);
  $(".popup-menu input[name='cwd']", elem).attr("data-original", header.cwd).val(header.cwd);
  $(".popup-menu input[name='cmd']", elem).attr("data-original", header.cmdline).val(header.cmdline);
}

function initializeAddLink() {
  $("a.add").click(function(e) {
    e.preventDefault();

    var elem = $("#list .service.template").clone();
    elem.removeClass("template");
    $(".header", elem).remove();
    $(".popup-menu", elem).show();
    $("a.delete", elem).remove();
    $("a.save", elem).click(function(e) {
      e.preventDefault();

      var data = {
        name: $(".popup-menu input[name='name']", elem).val(),
        cwd: $(".popup-menu input[name='cwd']", elem).val(),
        cmdline: $(".popup-menu input[name='cmd']", elem).val()
      };

      $.ajax({
        url: "/services/header",
        type: "post",
        data: data
      })
      .done(function() {
        refreshList();
        elem.remove();
        $("a.add").show();
      })
      .error(function(xhr, err, thrown) {
        alert(err + ": " + thrown);
      });
    });
    $("a.cancel", elem).click(function(e) {
      e.preventDefault();
      elem.remove();
      $("a.add").show();
    });
    $("#list ul").append("<li>").append(elem);

    $("a.add").hide();
  });
}

function start(id) {
  $.get("/services/" + id + "/start")
    .done(function(data) {
      refreshList();  // terribly inefficient!
    });
}

function stop(id) {
  $.get("/services/" + id + "/stop")
    .done(function(data) {
      refreshList();  // terribly inefficient!
    });
}

function added(previous, next, callback) {
  for(var i=0; i < next.length; i++) {
    var found = false;

    for(var j=0; j < previous.length; j++) {
      if(next[i].id === previous[j].id) {
        found = true;
        break;
      }
    }

    if(!found) {
      console.log("Identified new service [" + JSON.stringify(next[i]) + "]");
      callback(next[i]);
    }
  }
}

function changed(previous ,next, callback) {
  for(var i=0; i < previous.length; i++) {
    for(var j=0; j < next.length; j++) {
      if(previous[i].id === next[j].id) {
        if(!_.isEqual(previous[i], next[j])) {
          console.log("Identified updated service [" + JSON.stringify(previous[i]) + " : " + JSON.stringify(next[j]) + "]");
          callback(previous[i], next[j]);
          break;
        }
      }
    }
  }
}

function removed(previous, next, callback) {
  for(var i=0; i < previous.length; i++) {
    var found = false;

    for(var j=0; j < next.length; j++) {
      if(previous[i].id === next[j].id) {
        found = true;
        break;
      }
    }

    if(!found) {
      console.log("Identified obsolete service [" + JSON.stringify(previous[i]) + "]");
      callback(previous[i]);
    }
  }
}

function showDetail(id) {
  $.get("/services/" + id)
    .done(function(detail) {
      console.log("Updating detail: " + JSON.stringify(detail));

      var elem = $("#detail");

      elem.attr("data-id", detail.header.id);

      $(".name", elem).text(detail.header.name);
      $(".console .output", elem).html(detail.output != null ? detail.output : "");
      $(".console", elem).scrollTop($(".console", elem)[0].scrollHeight);

      elem.show();
    });
}
