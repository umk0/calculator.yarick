//let database = window.electronAPI.getDatabase();
//window.electronAPI.debug(twig);

! function (r) {
  r.fn. /*  */
    serializeObject = function () {
      var n = this,
        u = {},
        i = {},
        h = {
          validate: /^[a-zA-Z][a-zA-Z0-9_]*(?:\[(?:\d*|[a-zA-Z0-9_]+)\])*$/,
          key: /[a-zA-Z0-9_]+|(?=\[\])/g,
          push: /^$/,
          fixed: /^\d+$/,
          named: /^[a-zA-Z0-9_]+$/
        };
      return this.build = function (e, i, t) {
        return e[i] = t, e
      }, this.push_counter = function (e) {
        return void 0 === i[e] && (i[e] = 0), i[e]++
      }, r.each(r(this).serializeArray(), function () {
        if (h.validate.test(this.name)) {
          for (var e, i = this.name.match(h.key), t = this.value, a = this.name; void 0 !== (e = i.pop());) a = a.replace(new RegExp("\\[" + e + "\\]$"), ""), e.match(h.push) ? t = n.build([], n.push_counter(a), t) : e.match(h.fixed) ? t = n.build([], e, t) : e.match(h.named) && (t = n.build({}, e, t));
          u = r.extend(!0, u, t)
        }
      }), u
    }
}(jQuery);
app = {
  data: null,
  init: function () {

    $("#max-button").hide();
    $("#close-button").click(function () {
      window.electronAPI.controll(0);
    });
    $("#min-button").click(function () {
      window.electronAPI.controll(1);
    });
    $("#max-button").click(function () {
      $(this).hide();
      $("#restore-button").show();
      window.electronAPI.controll(2);
    });
    $("#restore-button").click(function () {
      $(this).hide();
      $("#max-button").show();
      window.electronAPI.controll(2);
    });
    this.renderHome();
  },
  twig: function (tpl, data) {
    return window.electronAPI.getTwig(tpl, data);
  },
  renderHome: function () {
    var self = this;
    self.data = window.electronAPI.getData();
    html = this.twig("home.twig", { data: self.data });
    $("#content").html(html);
    flatpickr("#selectRange", {
      mode: "range",
      onChange: function (selectedDates) {
        if (selectedDates.length == 2) {
          var from = selectedDates[0];
          var to = selectedDates[1];
          $("#selectedDateH2").html("Выбранный промежуток: " + moment(from).format('DD.MM.YYYY') + " - " + moment(to).format('DD.MM.YYYY'));
          self.data = window.electronAPI.setRange([moment(from).unix(), moment(to).unix()]);
          self.renderHome();
        }
      }
    });
    $("table span[type='button']").click(function () {
      var el = $(this);
      var modal = $("#editDay");
      modal.find("#editDayLabel").html("Редактирования дня: " + moment.unix(el.data('timestamp')).format('DD.MM.YYYY'));
      modal.find("input[name='date']").val(moment.unix(el.data('timestamp')).format('YYYY-MM-DD'));
      modal.find("input[name='value']").val(el.data('value'));
      modal.find("input[name='old_total']").val(el.data('total'));
      modal.find("input[name='porog']").val(el.data('porog'));
      modal.find("input[name='percentage']").val(el.data('percentage'));
      modal.find("input[name='id']").val(el.data('id'));
      modal.modal('toggle');
      $("#formEdit").submit(function () {
        var data = $(this).serializeObject();
        data["date"] = moment(data["date"]).unix();
        window.electronAPI.editDay(data);
        $('#editDay').modal('toggle');
        self.renderHome();
        return false;
      });
    })
    $("#formAdd").submit(function () {
      var data = $(this).serializeObject();
      data["date"] = moment(data["date"]).unix();
      window.electronAPI.addDay(data);
      $(this).find("input[name='value']").val("");
      $(this).find("input[name='date']").val(moment().format('YYYY-MM-DD'));
      $('#addDay').modal('toggle');
      self.renderHome();
      return false;
    });
    const day = ['','Пн','Вт','Ср','Чт','Пт'];
    var days_total = {'Пн':0,'Вт':0,'Ср':0,'Чт':0,'Пт':0};
    self.data.data.forEach(function(element){
        if(element){
          for(var i = 1; i <= 5; i++){
            if(element[i]){
              if(!days_total[day[i]]){
                days_total[day[i]] = 0;
              }
              days_total[day[i]] += element[i].total;
            }
          }
        }
    });
    var data_progress = {'Пн':0,'Вт':0,'Ср':0,'Чт':0,'Пт':0};
    for(var i = 1; i <= 5; i++){
      if(!data_progress[day[i-1]]){//понедельник
        data_progress[day[i]] = days_total[day[i]];
      }else{
        data_progress[day[i]] = data_progress[day[i-1]] + days_total[day[i]];
      }
    }
    const data = {
      labels: ['Пн','Вт','Ср','Чт','Пт'],
      datasets: [
        {
          label: 'По дням',
          data: days_total,
          borderColor: "#81a8ff",
          backgroundColor: "#004eff",
          type: 'bar'
        },
        {
          label: 'Рост/Спад',
          data: data_progress,
          borderColor: "#9cff00",
          backgroundColor: "#9cff00",
          type: 'line'
        }
      ]
    };
    const config = {
      data: data,
    };
    const ctx = document.getElementById('myChart');
    new Chart(ctx, config);
  },
  setBalance: function () {
    var self = this;
    var modal = $("#setBalance");
    modal.modal('toggle');
    $("#formBalance").submit(function () {
      var data = $(this).serializeObject();
      window.electronAPI.setBalance(data);
      modal.modal('toggle');
      self.renderHome();
      return false;
    });
  },
  clearBase: function () {
    var self = this;
    var modal = $("#clearBase");
    modal.modal('toggle');
    $("#formСlearBase").submit(function () {
      window.electronAPI.clearBase();
      modal.modal('toggle');
      self.renderHome();
    });
  }
};
app.init();