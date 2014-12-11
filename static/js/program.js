var inject_once = true;
if($('#page-program')) {
$(document).on( "pageshow", '#page-program', function( event, ui ) {
      if(inject_once) {
        inject_once=false;
        Blockly.inject(document.getElementById('blocklyDiv'),
            {path: '../../', toolbox: document.getElementById('toolbox')});
      }

      $('[href="#page-program"]').addClass( "ui-btn-active" );
      $('[href="#page-control"]').removeClass( "ui-btn-active" );
});

$(document).on( "pagecreate", '#page-program', function( event ) {
      $("#b_new_prog").on("click", newProg);
      $("#b_load_prog").on("click", loadProg);
      $("#b_save_prog").on("click", saveProg);
      $("#b_save_prog_as").on("click", saveProgAs);
      $("#b_save_prog_as_post").on("click", saveProgAsPost);
      $("#b_show_prog").on("click", showProg);
      $("#b_run_prog").on("click", runProg);
      $("#b_end_prog").on("click", endProg);
      $("#b_end_prog_d").on("click", endProg);
      $("#b_new_prog_post").on("click", newProgPost);
      $("#b_load_prog_post").on("click", loadProgPost);
      loadProgList();
    });
}
    var prog = {};
    var progList = {};

    function loadProgList() {
      try {
        $.ajax({url: '/program/list', dataType: "json", type: "GET", success:function(data) {
          progList = data;
        }});
      } catch (e) {
        alert(e);
      }      
    }

    function newProg() {
      $("#dialogNewProg").popup("open", {transition: "pop"});
    }

    function newProgPost() {
      $("#dialogNewProg").popup("close");
      Blockly.mainWorkspace.clear();
      var name = $("#i_new_prog_name").val();
      if($.inArray(name, progList)>=0) {
        if(!confirm(BotMessages.ProgramExists)) {
           return;
        }
      }
      prog.name = name;
    }

    function loadProg() {
      $('#i_prog_list').empty();
      for(i in progList) {
        var name = progList[i];
        $('#i_prog_list').append('<li data-prog-name="' + name +'"><a href="#" class="c_load_prog"><h2>'+name+'</h2></a><a href="#" class="c_delete_prog">Delete program</a></li>');
      }
      $('#i_prog_list').listview('refresh'); 
      $('.c_load_prog').on('click', loadProgPost);
      $('.c_delete_prog').on('click', deleteProg);
      $("#dialogLoadProg").popup("open", {transition: "pop"});
    }

    function loadProgPost() {
      $("#dialogLoadProg").popup("close");
      $.mobile.loading("show");
      Blockly.mainWorkspace.clear();
      prog.name=$(this).parent('li').attr('data-prog-name');
      try {
        var data =  {'name': prog.name};
        $.ajax({url: '/program/load', data: data, type: "GET", success:function(data) {
          var xml = Blockly.Xml.textToDom(data);
          Blockly.Xml.domToWorkspace(Blockly.mainWorkspace, xml);
          $.mobile.loading("hide");
	}});
      } catch (e) {
        alert(e);
      }
    }

    function saveProg() {
      // Generate Dom code and display it.
      Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
      var xml_code = Blockly.Xml.workspaceToDom(Blockly.mainWorkspace);
      var dom_code = Blockly.Xml.domToText(xml_code);

      window.LoopTrap = 1000;
      Blockly.Python.INFINITE_LOOP_TRAP = '  get_prog_eng().check_end()\n';
      var code = Blockly.Python.workspaceToCode();
      Blockly.Python.INFINITE_LOOP_TRAP = null;

      var data =  {'name': prog.name, 'dom_code': dom_code, 'code': code};
      $.ajax({url: '/program/save', data: data, type: "POST", success:function() {
	  alert(BotMessages.ProgramSaved);
          loadProgList();
	}});
    }

    function saveProgAs() {
      $("#dialogSaveProgAs").popup("open", {transition: "pop"});
    }

    function saveProgAsPost() {
      $("#dialogSaveProgAs").popup("close");
      var name = $("#i_save_prog_as_name").val();
      if($.inArray(name, progList)>=0) {
        if(!confirm(BotMessages.ProgramExists)) {
           return;
        }
      }
      prog.name = name;
      saveProg();
    }

    function deleteProg() {
      var prog_element = $(this).parent('li'); 
      var name=prog_element.attr('data-prog-name');
      if(confirm("Delete program " + name + "?")) {
        var data =  {'name': name};
        $.ajax({url: '/program/delete', data: data, type: "POST", success:function() {
          prog_element.remove();
          $('#i_prog_list').listview('refresh');
          loadProgList();
	  }});
       }
    }

    function showProg() {
      // Generate JavaScript code and display it.
      Blockly.JavaScript.INFINITE_LOOP_TRAP = null;
      var code = Blockly.Python.workspaceToCode();
      alert(code);
    }

    function runProg() {
      var bot = new CoderBot();
      // Generate JavaScript code and run it.
      window.LoopTrap = 1000;
      Blockly.Python.INFINITE_LOOP_TRAP = '  get_prog_eng().check_end()\n';
      var code = Blockly.Python.workspaceToCode();
      Blockly.Python.INFINITE_LOOP_TRAP = null;
      try {
        var data =  {'name': 'one',
                     'code': code};
        $.ajax({url: '/program/exec', data: data, type: "POST"});
        $("#dialogRunning").popup("open", {transition: "pop"});
        setTimeout(statusProg, 1000);
      } catch (e) {
        alert(e);
      }
    }

    function endProg() {
      $.ajax({url: '/program/end', type: "POST"});
      $("#dialogRunning").popup("close");
    }

    function statusProg() {
      $.ajax({url: '/program/status', dataType: "json", type: "GET", success:function(data) {
        console.log(data.running);
        if(!data.running) {
          $('#b_end_prog_d').text('Close');
          $('#i_dialog_running_title').text('CoderBot stopped');
        } else {
          setTimeout(statusProg, 1000);
        }  
      }});
    }