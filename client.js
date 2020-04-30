$(function () {

    /*
    * Connecting to socket.io
    */
    var socket = io.connect('http://127.0.0.1:4000');

    /*
    * Entering chat and loading users
    */
    $("a#enterChat").click(function (e) {
        e.preventDefault();

        let username = $("#username").val();

        localStorage.setItem("username", username);

        if (username != "") {

            socket.emit("username", username);

            $("div#enterUsername").addClass('hidden');
            $("div#chatMain").removeClass('hidden');

            socket.on('users', function (data) {
                data.forEach(element => {
                    if ( ! $("li#" + element.socketID).length && $("div#userList li").text() != element.username) {
                        $("div#userList ul").append('<li id="' + element.socketID + '">' + element.username + '</li>');
                    }
                });
            });

            $('div.chatroom.active').animate({scrollTop: $('div.chatroom.active').prop('scrollHeight')}, 1000);
            
        } else {
            alert('You must enter a username!')
        }

    });

    /*
    * Enter chat on pressing ENTER
    */
    $("input#username").keypress(function (e) {
        let username = $("#username").val();

        if (e.which == 13) {
            if (username != "") {
                $("a#enterChat").click();
            } else {
                alert('You must enter a username!')
            }
        }


    });

    /*
    * Handling log on
    */
    socket.on('logon', function (data) {
        $("div#userList ul").append('<li id="' + data.socketID + '">' + data.username + '</li>');
    });

    /*
    * Handling log off
    */
    socket.on('logoff', function (id) {
        $("li#" + id).remove();
        localStorage.removeItem("username");
    });

    /*
    * Handling chat input
    */
    $("#chatText").keypress(function (e) {

        if (e.which == 13) {

            let message = $("#chatText").val();
            let windowID = $("div#chatWindows div.active").attr('id');
            let publicChat = true;7
            let secondUsername = false;
            let secondUserID;
            let data;

            if (message != "") {

                if (! ($("#publicChat").hasClass('active'))) {
                    publicChat = false;
                    let usersDiv = $("div.chatroom.active").attr('id');
                    let userArray = usersDiv.split("-");

                    secondUsername = userArray[1];
                    secondUserID = $("li:contains(" + secondUsername + ")").attr('id');
                    if (! secondUserID) {
                        secondUsername = userArray[0];
                        secondUserID = $("li:contains(" + secondUsername + ")").attr('id');
                    }

                    data = {
                        from: localStorage.getItem("username"),
                        message: message,
                        date: moment().format("DD/MM/YYYY HH:mm"),
                        secondUserID: secondUserID,
                        secondUsername: secondUsername                    
                    };

                    // console.log(data);
                    socket.emit('secondUserTrigger', data);
                }

                socket.emit('input', {
                    username: localStorage.getItem("username"),
                    message: message,
                    date: moment().format("DD/MM/YYYY HH:mm"),
                    windowID: windowID,
                    publicChat: publicChat
                });

            $("#chatText").val("");
            e.preventDefault();

            } else {
                alert('You must enter a message');
            }
        }        

    });

    /*
    * Handling chat output
    */
    socket.on('output', function (data) {

        let windowID;

        if (! $("div#chatWindows div#"+data.windowID).length ) {
            let userArray = data.windowID.split("-");
            windowID = userArray[1] + "-" + userArray[0];
        } else {
            windowID = data.windowID;
        }

        if (data.publicChat && ! $("div#mainroom").hasClass('active')) {
            $("div#mainroom").addClass('new');
        } else {
            if (! $("div#"+windowID).hasClass('active')) {
                $("div#rooms div#"+data.username).addClass('new');
            }
        }

        $("div#chatWindows div#"+windowID).append("<p>[" + data.date + "] <b>" + data.username +  "</b>: " + data.message + "</p>");

        $('div.chatroom.active').animate({scrollTop: $('div.chatroom.active').prop('scrollHeight')}, 1000);
    });

    /*
    * Loading chat messages
    */
    socket.on('messages', function (data) {
        data.forEach(element => {
            $("div#publicChat").append("<p>[" + element.date + "] <b>" + element.username +  "</b>: " + element.message + "</p>");
        });
    });

    /*
    * Handling One-to-One chat 
    */
    $(document).on("dblclick", "div#userList li", function () {

        let socketID = $(this).attr('id');
        let senderUsername = localStorage.getItem("username");
        let receiverUsername = $(this).text();

        $("#chatText").focus();

        if ( $("div#rooms div#"+receiverUsername).length ) {
            $("div#rooms div#"+receiverUsername).click();
            return;
        }

        $("div#rooms > div").removeClass('active');
        $("div#chatWindows > div").removeClass('active');

        $("div#rooms").append("<div id=" + receiverUsername + " class='active'>" + "<span>x</span>" + receiverUsername + "</div>");
        $("div#chatWindows").append("<div id=" + senderUsername + "-" + receiverUsername + " class='chatroom active'></div>");
    });

    /*
    * Handling second user chat window
    */
    socket.on('secondUserChatWindow', function (data) {
        // console.log(data);
        if ( $("div#"+data.from).length ) return;

        $("div#rooms > div").removeClass('active');
        $("div#chatWindows > div").removeClass('active');

        $("div#rooms").append("<div id=" + data.from + " class='active'>" + "<span>x</span>" + data.from + "</div>");
        $("div#chatWindows").append("<div id=" + data.from + "-" + data.secondUsername + " class='chatroom active'></div>");
    });

    /*
    * Choosing room
    */
    $("div#rooms").on("click", "div", function () {

        $("div#rooms > div").removeClass('active');
        $("div#chatWindows > div").removeClass('active');

        $(this).addClass('active');
        $(this).removeClass('new');

        if ( $("div#mainroom").hasClass('active') ) {
            $("#publicChat").addClass('active');
        } else {

            let firstUsername = localStorage.getItem("username");
            let secondUsername = $(this).attr('id');

            $("div#chatWindows div#"+firstUsername + "-" + secondUsername).addClass('active');
            $("div#chatWindows div#"+secondUsername + "-" + firstUsername).addClass('active');
        }
    });

    /*
    * Closing private chat
    */
    $("div#rooms").on('click', 'span', function (e) {
        e.stopPropagation();

        let firstUsername = localStorage.getItem("username");
        let secondUsername = $(this).parent().attr('id');

        $("div#chatWindows div#"+firstUsername + "-" + secondUsername).remove();
        $("div#chatWindows div#"+secondUsername + "-" + firstUsername).remove();

        $(this).parent().remove();

        if ( $("div#rooms > div").length == 1 ) {
            $("div#mainroom").addClass('active');
            $("div#publicChat").addClass('active');
        }
    });

});