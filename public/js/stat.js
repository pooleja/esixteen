$( document ).ready(function() {
  Chart.defaults.global.legend.display = false;

  $.ajax({url: "/stat/oscounts", success: function(ret){

    if(ret.success){

      var labels = [];
      var counts = [];
      for(var i = 0; i < ret.result.length; i++){
        labels.push(ret.result[i]._id);
        counts.push(ret.result[i].count);
      }

      var ctx = document.getElementById("osChart");

      var myChart = new Chart(ctx, {
          type: 'bar',
          data: {
              labels:  labels,
              datasets: [{
                  data: counts,
              }]
          },
          options:
          {
              scales:
              {
                  yAxes: [{
                      ticks: {
                          beginAtZero:true
                      }
                  }]
              }
          }
      });
    }

  }});

  $.ajax({url: "/stat/current-uptime", success: function(ret){

    if(ret.success){
      $("#current-uptime-header").text("Current Uptime: " + ret.result.uptime + "%");
    }
  }});

  $.ajax({url: "/stat/historical-uptime", success: function(ret){

    if(ret.success){
      $("#historical-uptime-header").text("Historical Uptime: " + ret.result.uptime + "%");
    }
  }});

  $.ajax({url: "/stat/cpu-capacity", success: function(ret){
    if(ret.success){
      $("#cpu-capacity-header").text($("#cpu-capacity-header").text() + ": " + ret.result.count + " Cores" );
    }
  }});

  $.ajax({url: "/stat/cpu-utilization", success: function(ret){
    if(ret.success){
      $("#cpu-utilization-header").text($("#cpu-utilization-header").text() + ": " + (ret.result.utilization).toFixed(2) + "%" );
    }
  }});

  $.ajax({url: "/stat/memory-capacity", success: function(ret){
    if(ret.success){
      $("#memory-capacity-header").text($("#memory-capacity-header").text() + ": " + (ret.result.count / 1024 / 1024 / 1024 ).toFixed(2) + " GB" );
    }
  }});

  $.ajax({url: "/stat/memory-utilization", success: function(ret){
    if(ret.success){
      $("#memory-utilization-header").text($("#memory-utilization-header").text() + ": " + (ret.result.utilization).toFixed(2) + "%" );
    }
  }});

  $.ajax({url: "/stat/disk-capacity", success: function(ret){
    if(ret.success){
      $("#disk-capacity-header").text($("#disk-capacity-header").text() + ": " + (ret.result.count / 1024 / 1024 / 1024 ).toFixed(2) + " GB" );
    }
  }});

  $.ajax({url: "/stat/disk-utilization", success: function(ret){
    if(ret.success){
      $("#disk-utilization-header").text($("#disk-utilization-header").text() + ": " + (ret.result.utilization).toFixed(2) + "%" );
    }
  }});

});
