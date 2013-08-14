var Social = Social || {};

Social.ComponentTypes = {
    COMMENT : 'c',
    LIKE    : 'l',
    RIVER   : 'b',
    COUNTS  : 'sc'
};

Social.Utils.ajax = function(options) {
    var successCallback = options.success || function(){};
    var failureCallback = options.failure || function(){};
    var data = options.data;

    data["locale"] = Social.Config.locale;
    data["pc"] = Social.Config.name;

    var ajaxOptions = {
        url: options.url,
        dataType: 'json',
        data: options.data,
        xhrFields: {
            withCredentials: true
        },

        success: function(data) {
            successCallback(data);
        },
        error: function(data){
            if(console.log){
                console.log(arguments);
            }

            failureCallback(data);
        }
    };

    if (options.method=='GET') {
        ajaxOptions['type']='GET';
    } else {
        ajaxOptions['type']='POST'
    }

    if (!Social.$.support.cors) {
        ajaxOptions['dataType'] 		= 'jsonp';
        ajaxOptions['data']['method'] 	= options.method;
        ajaxOptions['jsonp']		 	= 'jsonp_callback';
    } else if (options.method && (options.method=='PUT' || options.method=='DELETE')) {
        ajaxOptions['beforeSend'] = function(xhr) {
            xhr.setRequestHeader("x-http-method-override", options.method);
        }
    }

    Social.$.ajax(ajaxOptions);
};

Social.Components = (function(){

    var components = {};
    components[Social.ComponentTypes.COMMENT] = {};
    components[Social.ComponentTypes.LIKE] = {};
    components[Social.ComponentTypes.RIVER] = {};
    components[Social.ComponentTypes.COUNTS] = {};

    return {

        get: function(type, componentId){

            if(typeof componentId === 'undefined'){
                return components[type];
            }

            return components[type][componentId];
        },
        add: function(componentId, component){
            components[component.type][componentId] = component;
        }
    }
})();

Social.onLoad = function(){

    Social.$(document).on('socialum:onLoggedOut', function(event, data){

        setTimeout(function(){

            var likes = Social.Likes.byPageId(data.pid),
                comments = Social.Comments.byPageId(data.pid);

            Social.Auth.form(data.pid).off('submit');
            Social.Auth.form(data.pid).on('submit', function(e){

                try {
                    Social.Auth.login(data.pid);
                } catch (e){
                    if(window.console) console.log(e);
                }

                e.preventDefault();
            });

            if(typeof comments !== 'undefined'){ comments.disableForm();}

            if(data.refresh){

                if(typeof likes !== 'undefined'){ likes.reload(); }
                if(typeof comments !== 'undefined'){ comments.reload();}
            }
        }, 10);
    });

    Social.$(document).on('socialum:onLoggedIn', function(event, data){

        setTimeout(function(){

            var comments = Social.Comments.byPageId(data.pid),
                likes = Social.Likes.byPageId(data.pid);

            Social.Auth.form(data.pid).off('submit');
            Social.Auth.form(data.pid).on('submit', function(e){
                Social.Auth.logout(data.pid);
                e.preventDefault();
            });

            if(typeof comments !== 'undefined'){ comments.enableForm();}

            if(data.refresh){
                if(typeof likes !== 'undefined'){ likes.reload(); }
                if(typeof comments !== 'undefined'){ comments.reload();}
            }
        }, 10);
    });

    Social.$(document).off('socialum:onAuthoringFormLoaded');
    Social.$(document).on('socialum:onAuthoringFormLoaded', function(event, data){

        setTimeout(function(){

            // init submit behaviour
            var comments = Social.Comments.byPageId(data.pid);

            if(typeof comments !== 'undefined'){
                comments.form().off('submit');
                comments.form().on('submit', function(e){

                    try {
                        var commentId = comments.form().find("input[name='commentId']").val();

                        if(commentId.length > 0){
                            comments.editComment(commentId);
                        } else {
                            comments.addComment();
                        }

                    } catch (e){
                        if(window.console) console.log(e);
                    }

                    e.preventDefault();
                });
            }

        }, 10);
    });

    Social.$(document).off('socialum:onCommentsListLoaded');
    Social.$(document).on('socialum:onCommentsListLoaded', function(event, data){

        setTimeout(function(){

            var commentsTarget = Social.Config.pages[data.pid].comments.target,
                comments = Social.Comments.byPageId(data.pid),
                likes = Social.Likes.byPageId(data.pid),
                river = Social.River.byPageId(data.pid);


            if(typeof comments !== 'undefined'){

                // init reply behaviour
                Social.$('#' + commentsTarget + ' .comments .comment-reply').each(function(idx, elem){

                    Social.$(elem).off('click');
                    Social.$(elem).on('click', function(e){

                        var cid = Social.$(elem).data('cid');

                        if(Social.$(elem).hasClass('cancel')){
                            comments.resetFormPosition();
                        } else {
                            comments.moveFormUnderComment(cid);
                        }

                        e.preventDefault();
                    });
                });

                // init edit behaviour
                Social.$('#' + commentsTarget + ' .comments .comment-edit').each(function(idx, elem){
                    Social.$(elem).off('click');
                    Social.$(elem).on('click', function(e){

                        var cid = Social.$(elem).data('cid');

                        if(Social.$(elem).hasClass('cancel-edit')){
                            comments.resetFormPosition();
                        } else {
                            comments.replaceCommentWithForm(cid);
                        }

                        e.preventDefault();
                    });
                });

                // init delete behaviour
                Social.$('#' + commentsTarget + ' .comments .comment-delete').each(function(idx, elem){
                    Social.$(elem).off('click');
                    Social.$(elem).on('click', function(e){

                        var cid = Social.$(elem).data('cid');
                        var timestamp = Social.$('#comment_' + cid + ' .timestamp').text();

                        timestamp = Social.$.trim(timestamp.substr(timestamp.indexOf(',')+1, timestamp.length));
                        var  message = timestamp ? 'Möchten Sie Ihren Kommentar von gerade, ' + timestamp +  ' löschen?' : 'Den Kommentar löschen?';

                        Social.Utils.showGlobalConfirm(message, function(){comments.deleteComment(cid);});

                        e.preventDefault();
                    });
                });

                // init comments like behaviour
                Social.$('#' + commentsTarget + ' .comments .like-button').each(function(idx, elem){

                    var cid = Social.$(elem).attr('data-cid'),
                        pid = Social.$(elem).attr('data-pid');

                    Social.$(elem).off('click');
                    Social.$(elem).on('click', function(e){
                        comments.like(pid, cid);
                        e.preventDefault();
                    });
                });

                // init follow discussion button behaviour
                Social.$('#' + commentsTarget + ' .comments .watch-link').off('click');
                Social.$('#' + commentsTarget + ' .comments .watch-link').on('click', function(e){

                    comments.followDiscussion();
                    e.preventDefault();
                });

            }

            // refresh social bar counts
            if(data.refresh){
               if(typeof likes !== 'undefined'){likes.reload();}
               if(typeof river !== 'undefined') {river.reload();}
            }

        }, 10);
    });

};

Social.showErrorOn = function(rootElement, msg){
    var msgWrapper = Social.$('<span></span>').html(msg);
    rootElement.find('.piErrMsg').html(msgWrapper);

    setTimeout(function(){
        rootElement.find('.piErrMsg').html('');
    }, 4000);
};


Social.Session = (function(){

    var init = function(pid){
        loadComponent(pid);
    };

    var loadComponent = function(pid){

        Social.Components.add(pid, new Social.Likes(pid));
        Social.Components.add(pid, new Social.Comments(pid));
        Social.Components.add(pid, new Social.River(pid));
        Social.Components.add(pid, new Social.Counts(pid));

    };

    return {
        init: function(pid){
            init(pid);
        }
    }
})();

Social.Auth = (function(){

    var formSelector = "#commentsAuthForm_",
        credentials = null;

    var init = function(pageId){

        var username = form(pageId).find('.socialumUser').val(),
            password = form(pageId).find('.socialumPw').val();

        if(username.length > 0 && password.length > 0){
            credentials = {user: username, password: password};
        }
    };

    var form = function(pageId){

        if(Social.$(formSelector + pageId).length > 0){
            return Social.$(formSelector + pageId);
        } else {
            throw 'auth form not found: ' + formSelector;
        }
    };

    var login = function(pageId){

        if(credentials == null){
            init(pageId);
        }
        if(credentials != null){

            Social.Utils.ajax({
                method: 'POST',
                url: Social.Config.baseUrl + Social.Config.services.auth.login,
                data:  Social.$.extend(Social.Config.pages[pageId].hash, credentials),
                success: function(data, status, xhr){

                    var template = Social.$("#pi-social-auth-form-tpl").html();
                    var html = Handlebars.compile(template)(data);

                    form(pageId).html(html);
                    Social.$(document.body).trigger('socialum:onLoggedIn', {refresh: true, pid: pageId});
                },
                failure: function(response, errorType){

                    if(Social.Utils.isPlainText(response)){
                        Social.showErrorOn(form(pageId), response.responseText);
                    } else {
                        Social.showErrorOn(form(pageId), Social.I18N.de.authFailed);
                    }
                    credentials = null;
                }
            });

        } else {
            Social.showErrorOn(form(pageId), "Bitte Benutzername und Passwort angeben.");
        }

        return false;
    };

    var logout = function(pageId){

        Social.Utils.ajax({
            method: 'POST',
            url: Social.Config.baseUrl + Social.Config.services.auth.logout,
            data: Social.Config.pages[pageId].hash,
            success: function(data, status, xhr){
                credentials = null;
                var template = Social.$("#pi-social-auth-form-tpl").html();
                var html = Handlebars.compile(template)(data);
                form(pageId).html(html);
                Social.$(document.body).trigger('socialum:onLoggedOut', {refresh: true, pid: pageId});
            },
            failure: function(response, errorType){}
        });
    };

    return {

        isLoggedIn: function(){
            return Social.Config.isLoggedIn || credentials != null;
        },
        userid: function() {
            var userid = credentials != null ? credentials.user : null;
            return userid;
        },
        logout: function(pageId){
            logout(pageId);
        },
        login: function(pageId){
            login(pageId);
        },
        form: function(pageId){
            return form(pageId);
        }
    }
})();

Social.Auth.pwdFocus = function() {
    $('#pi-social-fakepassword').hide();
    $('#pi-social-password').show();
    $('#pi-social-password').focus();
};

Social.Auth.pwdBlur = function() {
    if ($('#pi-social-password').attr('value') == '') {
        $('#pi-social-password').hide();
        $('#pi-social-fakepassword').show();
    }
};

Social.Likes = function(pageId){

    this.type = Social.ComponentTypes.LIKE;

    var target = Social.Config.pages[pageId].likes.target,
        $target = Social.$(Social.$('#' + target)),
        hash = Social.Config.pages[pageId].hash,
        template = Social.$("#pi-social-like-link-tpl").html(),
        opts = null;


    var _configure = function(){

        var likeEl = Social.$('#' + target);

        if( likeEl.attr('data-comments-count') != null && likeEl.attr('data-comments-count').length > 0 ){
            opts = {sbcc:likeEl.attr('data-comments-count')};
        } else if(typeof window.piSocialBarCommentsCount !== 'undefined' && window.piSocialBarCommentsCount.length > 0){
            opts = {sbcc:window.piSocialBarCommentsCount};
        }

    };

    var _render = function(model) {
        $target.html(Handlebars.compile(template)(model));
    };

    var _load = function(){

        if( typeof target !== 'undefined' && target.length > 0){

            _configure();
            Social.Utils.ajax({
                method: 'GET',
                url: Social.Config.baseUrl + Social.Config.services.likes.html,
                data: Social.$.extend(hash, opts),
                success: function(response){

                    _render(response);

                    $target.find('.like-button').on('click', function(e){
                        _like();
                        e.preventDefault();
                    });

                },
                failure: function(response){
                    if(window.console){console.log(response)}
                }
            });

        }
    };

    var _like = function(){

        var data = Social.$.extend(data, hash);

        if(typeof window.piPageTitle !== 'undefined' && window.piPageTitle.length > 0){
            data.pt = window.piPageTitle;
        }

        if(typeof window.piPageUri !== 'undefined' && window.piPageUri.length > 0){
            data.pu = window.piPageUri;
        }

        if(typeof window.piPageCategory !== 'undefined' && window.piPageCategory.length > 0){
            data.pc = window.piPageCategory;
        }

        if(typeof window.piPageTags !== 'undefined' && Social.$.isArray(window.piPageTags) && window.piPageTags.length > 0){
            data.ptg = {};
            for(var i = 0; i < window.piPageTags.length; i++){
                data.ptg[i] = window.piPageTags[i];
            }
        }

        if(Social.Auth.isLoggedIn()){

            Social.Utils.ajax({
                method: 'POST',
                url: Social.$('#' + target).find('.like-button').attr('data-url'),
                data: data,
                success: function(){
                    _load();
                },
                failure: function(response, state){
                    if(Social.Utils.isPlainText(response)){
                        Social.Utils.showGlobalAlert(response.responseText);
                    } else {
                        Social.Utils.showGlobalAlert(Social.I18N.de.likeError);
                    }

                }
            });
        } else {
            Social.Utils.showGlobalAlert(Social.I18N.de.authCannotLike);
        }
    };

    this.reload = function(){
        _load();
    };

    _load();
};
Social.Likes.byPageId = function(pageId){
    return Social.Components.get(Social.ComponentTypes.LIKE, pageId);
};


Social.Comments = function(pageId){

    this.type = Social.ComponentTypes.COMMENT;

    var formSelector = "#commentsAuthoringForm_" + pageId,
        answerCid = null,
        editCid = null,
        editTemp = null,
        editTitleText = null,
        editCommentText = null,
        target = Social.Config.pages[pageId].comments.target,
        hash = Social.Config.pages[pageId].hash,
        template = Social.$("#pi-social-comments-tpl").html(),
        templateListAll = Social.$("#pi-social-comments-list-all-tpl").html(),
        templateListApprovedOnly = Social.$("#pi-social-comments-list-approved_only-tpl").html(),
        templateLikeBtn = Social.$("#pi-social-comment-like-link-tpl").html(),
        $target = Social.$('#' + Social.Config.pages[pageId].comments.target);

    var _initIEBehavior = function(){
        var $userNameField = $target.find('input[name=user]'),
            $passwordField = $target.find('input[name=password]');

        $userNameField.val($userNameField.attr('placeholder')).css('color','#ccc');
        $userNameField.on('click', function(e){
            if($userNameField.val() == $userNameField.attr('placeholder')){
                $userNameField.val('');
            }
        });

        $passwordField.val($passwordField.attr('placeholder'));
    };

    var _load = function(callback){

        if( typeof target !== 'undefined' && target.length > 0){

            var cmsid = Social.Utils.Page.params.cmsid;
            if(typeof Social.Utils.Page.params.cmsid !== 'undefined' && Social.Utils.Page.params.cmsid.length > 0 && window.Social.Config.cmsids.indexOf(cmsid) === -1 ){
                window.Social.Config.cmsids.push(cmsid);
                hash.unfollow = cmsid;
            }

            Social.Utils.ajax({
                method: 'GET',
                url: Social.Config.baseUrl + Social.Config.services.comments.html,
                data: hash,
                success: function(data){

                    _render(data);

                    // are we logged in or logged out
                    if($target.find('input[name=pilogin]').length > 0){
                        Social.$(document.body).trigger('socialum:onLoggedOut', {refresh: false, pid: pageId});

                        if(Social.Config.isIE){
                            _initIEBehavior();
                        }
                    } else if($target.find('input[name=pilogout]').length > 0){
                        Social.$(document.body).trigger('socialum:onLoggedIn', {refresh: false, pid: pageId});
                    }

                    delete hash['unfollow'];

                    Social.$(document.body).trigger('socialum:onAuthoringFormLoaded', {pid: pageId});
                    Social.$(document.body).trigger('socialum:onCommentsListLoaded', {refresh: false, pid: pageId});

                    if(callback){
                        callback();
                    }
                },
                failure: function(response){
                    if(window.console){console.log(response)}
                }
            });
        }
    };

    var _render = function(model) {
        $target.html(Handlebars.compile(template)(model));
    };


    var _handleFollowDiscussionCheckbox = function(){

        if(self.form().find(".watch-check input[type='checkbox']").is(':checked')){
            self.form().find(".watch-check").remove();
        }
    };

    var _listComments = function(){

        if(self.form().find('input[name=parentId]').val().length > 0){
            self.resetFormPosition();
        }

        Social.Utils.ajax({
            method: 'GET',
            url: Social.Config.baseUrl + Social.Config.services.comments.list,
            data: hash,
            success: function(data){
                self.form().find('textarea').val('');
                self.form().find('input[name=subject]').val('');

                var compiledTpl;
                if(data.approvedOnly){
                    compiledTpl = Handlebars.compile(templateListApprovedOnly);
                } else {
                    compiledTpl = Handlebars.compile(templateListAll);
                }

                Social.$('#commentsList_' + pageId).html(compiledTpl(data));
                Social.$(document.body).trigger('socialum:onCommentsListLoaded', {refresh: true, pid: pageId});
            },
            failure: function(response){
                if(Social.Utils.isPlainText(response)){
                    Social.showErrorOn(self.form(), response.responseText);
                }
            }
        });
    };

    var _resetCommentActions = function(){
        Social.$('#commentsList_' + pageId + ' .comment-actions a.cancel').html('Antworten').removeClass("cancel");
        Social.$('#commentsList_' + pageId + ' .comment-actions a.cancel-edit').html('Bearbeiten').removeClass("cancel-edit");

    };

    this.moveFormUnderComment = function(cid){

        _resetCommentActions();

        var formHolder = Social.$('#commentsAuthoringForm_' + pageId).parent();

        // empty form
        formHolder.find("input[name='subject']").val('');
        formHolder.find("textarea").val('');

        answerCid = cid;

        var formHolderClass = formHolder.attr('class'),
            detachedForm = formHolder.contents().detach(),
            targetEl = Social.$('#commentAnswer_' + answerCid);

        Social.$('#comment_' + answerCid + ' > .comment-actions > .comment-reply').html('Antworten abbrechen').addClass("cancel");

        formHolder.hide();
        detachedForm.find('input[name=parentId]').val(answerCid);
        targetEl.attr('class', formHolderClass).html(detachedForm);
        targetEl.show();

        // restore comment items content, if it was in edit mode
        if(editCid && editTemp){
            Social.$('#comment_' + editCid).html(editTemp);
            editCid = null;
            editTemp = null;
            Social.$(document.body).trigger('socialum:onCommentsListLoaded', {refresh: false, pid: pageId})
        }

    };

    this.replaceCommentWithForm = function(cid){

        _resetCommentActions();

        var formHolder = Social.$('#commentsAuthoringForm_' + pageId).parent();

        // form is currently in edit state
        if(editCid){
            // restore comment
            Social.$('#comment_' + editCid).html(editTemp);

            // force event handlers to re-register, $.clone(true) doesnt work as expected
            Social.$(document.body).trigger('socialum:onCommentsListLoaded', {refresh: false, pid: pageId});
            Social.$(document.body).trigger('socialum:onAuthoringFormLoaded', {pid: pageId});
        }

        editCid = cid;

        editTitleText = Social.$('#comment_' + editCid + ' > .comment-text h6').text();
        editCommentText = Social.$('#comment_' + editCid + ' > .comment-text p').text();

        var formHolderClass = formHolder.attr('class'),
            detachedForm = formHolder.contents().detach(),
            targetEl = Social.$('#comment_' + editCid + ' > .comment-text');

        formHolder.hide();

        // save replaced html snippet temporaily, clone without event handlers
        editTemp = Social.$('#comment_' + editCid).contents().clone(false);

        Social.$('#comment_' + editCid + ' > .comment-actions > .comment-edit').html('Bearbeiten abbrechen').addClass("cancel-edit");

        detachedForm.find('input[name=commentId]').val(editCid);

        if(editTitleText.length > 0){
            detachedForm.find("input[name='subject']").val(editTitleText);
        }

        if(editCommentText.length > 0){
            detachedForm.find('textarea').val(editCommentText);
        }

        targetEl.attr('class', formHolderClass).html(detachedForm);
    };

    this.resetFormPosition = function(){


        if(answerCid != null){
            Social.$('#comment_' + answerCid + ' .comment-actions > .comment-reply').html('Antworten').removeClass("cancel");
            var form = Social.$('#commentAnswer_' + answerCid).attr('class', '').contents().detach();

            form.find('input[name=parentId]').val('');
            form.find('input[name=commentId]').val('');

            Social.$('#commentsAuthoringFormHolder_' + pageId).html(form).show();
            answerCid = null;
        }

        if(editCid != null){
            Social.$('#comment_' + editCid + ' .comment-actions > .comment-edit').html('Bearbeiten').removeClass("cancel-edit");
            var form = Social.$('#comment_' + editCid + ' .comments-authoring' ).contents().detach();

            // empty form fields
            form.find("input[name='subject']").val('');
            form.find("textarea").val('');
            form.find('input[name=parentId]').val('');
            form.find('input[name=commentId]').val('');

            // restore comment
            Social.$('#comment_' + editCid).html(editTemp);
            editTemp = null;
            Social.$('#commentsAuthoringFormHolder_' + pageId).html(form).show();
            editCid = null;

            Social.$(document.body).trigger('socialum:onCommentsListLoaded', {refresh: false, pid: pageId});
        }
    };

    this.disableForm = function(){
        self.form().find("textarea").attr("placeholder", 'Zum Kommentieren anmelden.').attr('disabled', 'disabled');
        self.form().find('input[type=submit]').attr('disabled', 'disabled');
        self.form().find('input[name=subject]').attr('disabled', 'disabled');
    };

    this.enableForm = function(){
        self.form().find("textarea").attr('placeholder','Hier den Kommentartext eingeben').removeAttr('disabled');
        self.form().find('input[type=submit]').removeAttr('disabled');
        self.form().find('input[name=subject]').removeAttr('disabled');
    };

    this.form = function(){

        if(Social.$(formSelector).length > 0){
            return Social.$(formSelector);
        } else {
            throw 'comments form not found: ' + formSelector;
        }
    };

    this.reload = function(){

        // keep input from input field and textarea
        var subjectTemp = this.form().find("input[name='subject']").val(),
            bodyTemp = this.form().find("textarea").val();

        _load(function(){

            self.form().find("input[name='subject']").val(subjectTemp);
            self.form().find("textarea").val(bodyTemp);

            // is editable by user?
            if(Social.$('#comment_' + answerCid + ' > .comment-actions .comment-edit').length > 0){
                if(answerCid){
                    self.replaceCommentWithForm(answerCid);
                }
            } else {
                if(answerCid){
                    self.moveFormUnderComment(answerCid);
                }
            }
        });
    };

    this.followDiscussion = function(){

        var btnHolder = Social.$('#followLink_' + pageId),
            btn = btnHolder.find('.watch-link:first'),
            uri = btn.attr('data-url');

        Social.Utils.ajax({
            method: 'POST',
            url: uri,
            data: Social.$.extend({'pid': pageId}, hash),
            success: function(response){

                btnHolder.html(response);
                self.reload(); //  complete reload, to ensure correct display state
            },
            failure: function(response){
                if(Social.Utils.isPlainText(response)){
                    Social.Utils.showGlobalAlert(response.responseText);
                } else {
                    Social.Utils.showGlobalAlert(Social.I18N.de.followError);
                }
            }
        });

    };

    this.like = function(pid, cid){

        var $btnHolder = Social.$('#likeLink_' + cid),
            btn = $btnHolder.find('.like-button:first'),
            uri = btn.attr('data-url');

        if(Social.Auth.isLoggedIn()){

            Social.Utils.ajax({
                method: 'POST',
                url: uri,
                data: Social.$.extend({'pid': pid, 'cid': cid}, hash),
                success: function(response, status, jqXhr){

                    $btnHolder.html(Handlebars.compile(templateLikeBtn)(response));
                    Social.$(document.body).trigger('socialum:onCommentsListLoaded', {refresh: false, pid: pid});
                },
                failure: function(response){

                    if(Social.Utils.isPlainText(response)){
                        Social.Utils.showGlobalAlert(response.responseText);
                    } else {
                        Social.Utils.showGlobalAlert(Social.I18N.de.likeError);
                    }
                }
            });
        } else {
            Social.Utils.showGlobalAlert(Social.I18N.de.authCannotLike);
        }
    };

    this.addComment = function(){

        var data = {
            body : self.form().find('textarea').val(),
            parentId: self.form().find('input[name=parentId]').val(),
            follow: self.form().find('input[name=watchComments]').is(':checked') ? '1' : '0',
            pu: location.href
        };

        if(self.form().find('input[name=subject]').length > 0) {
            data.subject = self.form().find('input[name=subject]').val();
        }

        data = Social.$.extend(data, hash);

        if(typeof window.piPageTitle !== 'undefined' && window.piPageTitle.length > 0){
            data.pt = window.piPageTitle;
        }

        if(typeof window.piPageUri !== 'undefined' && window.piPageUri.length > 0){
            data.pu = window.piPageUri;
        }

        if(typeof window.piPageCategory !== 'undefined' && window.piPageCategory.length > 0){
            data.pc = window.piPageCategory;
        }

        if(typeof window.piPageTags !== 'undefined' && Social.$.isArray(window.piPageTags) && window.piPageTags.length > 0){
            data.ptg = {};
            for(var i = 0; i < window.piPageTags.length; i++){
                data.ptg[i] = window.piPageTags[i];
            }
        }

        Social.Utils.ajax({
            method: 'POST',
            url: Social.Config.baseUrl + Social.Config.services.comments.create,
            data: data,
            success: function(response){
                _handleFollowDiscussionCheckbox();
                _listComments();
            },
            failure: function(response){

                if(Social.Utils.isPlainText(response)){
                    Social.showErrorOn(self.form(), response.responseText);
                } else {
                    Social.showErrorOn(self.form(), Social.I18N.de.commentError);
                }
            }
        });

    };

    this.editComment = function(cid){

        var data = {
            body : self.form().find('textarea').val(),
            pid: pageId,
            cid: cid,
            follow: self.form().find('input[name=watchComments]').is(':checked') ? '1' : '0'
        };

        if(self.form().find('input[name=subject]').length > 0) {
            data.subject = self.form().find('input[name=subject]').val();
        }

        data = Social.$.extend(data, hash);

        Social.Utils.ajax({
            method: 'POST',
            url: Social.Config.baseUrl + Social.Config.services.comments.edit,
            data: data,
            success: function(response){
                _handleFollowDiscussionCheckbox();
                self.resetFormPosition();
                _listComments();
            },
            failure: function(response){

                if(Social.Utils.isPlainText(response)){
                    Social.showErrorOn(self.form(), response.responseText);
                } else {
                    Social.showErrorOn(self.form(), Social.I18N.de.commentError);
                }

            }
        });
    };

    this.deleteComment = function(cid){

        var data = {
            pid: pageId,
            cid: cid
        };

        if(self.form().find('input[name=subject]').length > 0) {
            data.subject = self.form().find('input[name=subject]').val();
        }

        data = Social.$.extend(data, hash);

        Social.Utils.ajax({
            method: 'POST',
            url: Social.Config.baseUrl + Social.Config.services.comments.remove,
            data: data,
            success: function(response){
                self.resetFormPosition();
                _listComments();
            },
            failure: function(response){
                if(Social.Utils.isPlainText(response)){
                    Social.Utils.showGlobalAlert(response.responseText);
                } else {
                    Social.Utils.showGlobalAlert(Social.I18N.de.commentDeleteError);
                }
            }
        });
    };

    var self = this;

    _load();
};
Social.Comments.byPageId = function(pageId){
    return Social.Components.get(Social.ComponentTypes.COMMENT, pageId);
};

Social.River = function(pageId){

    this.type = Social.ComponentTypes.RIVER;

    var opts = {},
        target = Social.Config.pages[pageId].river.target,
        hash = Social.Config.pages[pageId].hash,
        template = Social.$("#pi-social-river-tpl").html();


    var _load = function(){

        if( typeof target !== 'undefined' && target.length > 0){

            _configure();

            Social.Utils.ajax({
                method: 'GET',
                url: Social.Config.baseUrl + Social.Config.services.river.html,
                data: Social.$.extend(hash, opts),
                success: function(response){
                    _render(response);
                    _initClickHandler();

                },
                failure: function(response){
                    if(window.console){console.log(response)}
                }
            });
        }
    };

    var _render = function(model) {
        Social.$('#' + target).html(Handlebars.compile(template)(model));
    };

    var _initClickHandler = function(){

        Social.$('#' + target).find('.river-box .river-more').click(function(e){
            //pi$('#' + target).find('.river-entry').show();
            Social.$('#' + target).find('.river-entry').slideDown("fast");
            Social.$('#' + target).find('.river-box .river-more').hide();

            e.preventDefault();
        });

        Social.$('#' + target).find('.river-entry').each(function(idx, elem){

            if(Social.$(elem).find('.river-subject a').length > 0){
                var linkUri = Social.$(elem).find('.river-subject a:first').attr('href');
                Social.$(elem).click(function(e){
                    document.location.href = linkUri;
                });
            }
        });
    };

    var _configure = function(){

        var riverEl = Social.$('#' + target);

        if( riverEl.attr('data-max') != null && riverEl.attr('data-max').length > 0 ){
            opts.max = riverEl.attr('data-max');
        } else if(typeof window.piRiverMax !== 'undefined' && window.piRiverMax > 0){
            opts.max = window.piRiverMax;
        }

        if( riverEl.attr('data-min') != null && riverEl.attr('data-min').length > 0 ){
            opts.min = riverEl.attr('data-min');
        } else if(typeof window.piRiverMin !== 'undefined' && window.piRiverMin > 0){
            opts.min = window.piRiverMin;
        }

        if( riverEl.attr('data-parentsonly') != null && riverEl.attr('data-parentsonly').length > 0 ){
            opts.parentsOnly = riverEl.attr('data-parentsonly');
        } else if(typeof window.piRiverParentsOnly !== 'undefined'){
            opts.parentsOnly = piRiverParentsOnly;
        }

        if( riverEl.attr('data-page') != null && riverEl.attr('data-page').length > 0){
            opts.rpid = riverEl.attr('data-page');
        } else if(typeof window.piRiverPage !== 'undefined' && window.piRiverPage.length > 0){
            opts.rpid = window.piRiverPage;
        }

        if( riverEl.attr('data-category') != null && riverEl.attr('data-category').length > 0 ){
            opts.rpc = riverEl.attr('data-category');
        } else if(typeof window.piRiverPageCategory !== 'undefined' && window.piRiverPageCategory.length > 0){
            opts.rpc = window.piRiverPageCategory;
        }

        if( riverEl.attr('data-title') != null && riverEl.attr('data-title').length > 0 ){
            opts.rti = riverEl.attr('data-title');
        } else if(typeof window.piRiverTitle !== 'undefined' && window.piRiverTitle.length > 0){
            opts.rti = window.piRiverTitle;
        }

        if( riverEl.attr('data-allComments') != null && riverEl.attr('data-allComments').length > 0 ){
            opts.rac = riverEl.attr('data-allComments');
        } else if(typeof window.piRiverAllComments !== 'undefined' && window.piRiverAllComments.length > 0){
            opts.rac = window.piRiverAllComments;
        }

    };

    this.reload = function(){
        _load();
    };

    var self = this;

    _load();
};
Social.River.byPageId = function(pageId){
    return Social.Components.get(Social.ComponentTypes.RIVER, pageId);
};

Social.Counts = function(pageId){

    this.type = Social.ComponentTypes.COUNTS;

    var _countsPage = {},
        _countsCategory = {},
        _targetCssClass = 'pi-social-counter',
        _likeCountsCssClass = 'likes-counter',
        _commentCountsCssClass = 'comments-counter',
        _pageIdAttrName = 'data-pageid',
        _categoryAttrName = 'data-category',
        _showCommentsCountAttrName = 'data-comments-count',
        _showCommentsCount = {};

    var _configure = function(){

        if(typeof window.piSocialCountsClass !== 'undefined' && window.piSocialCountsClass.length > 0){
            _targetCssClass = window.piSocialCountsClass;
        }
    };

    var _load = function(){

        _configure();
        _collectTargets();

        var pageIds = [];
        for(id in _countsPage){
            pageIds.push(id);
        }

        var categoryNames = [];
        for(categoryName in _countsCategory){
            categoryNames.push(categoryName);
        }

        if(pageIds.length > 0 || categoryNames.length > 0){

            Social.Utils.ajax({
                method: 'GET',
                url: Social.Config.baseUrl + Social.Config.services.app.counts,
                data:  {sites: pageIds.join(','), categories: categoryNames.join(',')},
                success: function(response){
                    _assignCounts(response);
                },
                failure: function(response){}
            });
        }
    };

    var _assignCounts = function(countResult){

        Social.$('.'+_targetCssClass).each(function(idx, el){

            var counts;

            var pageId = Social.$(el).attr(_pageIdAttrName);
            if(typeof pageId !== 'undefined' && pageId.length > 0){

                counts = countResult[pageId];
                if(typeof counts !== 'undefined'){

                    var targetLikeCounts = Social.$(el).hasClass(_likeCountsCssClass) ? Social.$(el) : Social.$(el).find('.'+_likeCountsCssClass);
                    targetLikeCounts.html(counts.likes);

                    if(_showCommentsCount[pageId]){

                        var targetCommentsCounts = Social.$(el).hasClass(_commentCountsCssClass) ? Social.$(el) : Social.$(el).find('.'+_commentCountsCssClass);
                        targetCommentsCounts.html(counts.comments);
                    } else {
                        Social.$(el).find('.'+_commentCountsCssClass).remove();
                    }
                }
            }

            var categoryName = Social.$(el).attr(_categoryAttrName);
            if(typeof categoryName !== 'undefined' && categoryName.length > 0){

                counts = countResult[categoryName];
                if(typeof counts !== 'undefined'){

                    var targetLikeCounts = Social.$(el).hasClass(_likeCountsCssClass) ? Social.$(el) : Social.$(el).find('.'+_likeCountsCssClass);
                    targetLikeCounts.html(counts.likes);

                    if(_showCommentsCount[categoryName]){
                        var targetCommentsCounts = Social.$(el).hasClass(_commentCountsCssClass) ? Social.$(el) : Social.$(el).find('.'+_commentCountsCssClass);
                        targetCommentsCounts.html(counts.comments);
                    } else {
                        Social.$(el).find('.'+_commentCountsCssClass).remove();
                    }

                }
            }
        });

    };

    var _collectTargets = function(){

        Social.$('.'+_targetCssClass).each(function(idx, el){

            var showCommentsCount = Social.$(el).attr(_showCommentsCountAttrName);

            var pageId = Social.$(el).attr(_pageIdAttrName);
            if(typeof pageId !== 'undefined' && pageId.length > 0){
                _countsPage[pageId] = {comments: null, likes: null};
                _showCommentsCount[pageId] = typeof showCommentsCount === 'undefined' || showCommentsCount == 'true';
            }

            var categoryName = Social.$(el).attr(_categoryAttrName);
            if(typeof categoryName !== 'undefined' && categoryName.length > 0){
                _countsCategory[categoryName] = {comments: null, likes: null};
                _showCommentsCount[categoryName] = typeof showCommentsCount === 'undefined' || showCommentsCount == 'true';
            }
        });

    };

    this.reload = function(){
        _load();
    };

    this.refresh = function(){
        _load();
    };

    var self = this;

    _load();
};

Social.Counts.refresh = function(){
    var counts = Social.Components.get(Social.ComponentTypes.COUNTS);

    if(counts){
        for(pageId in counts){
            var count = counts[pageId];
            count.refresh();
        }
    }
};


Social.Counts.byPageId = function(pageId){
    return Social.Components.get(Social.ComponentTypes.COUNTS, pageId);
};

Social.initComponents = function(pageId){

    function initHandlebars(){
        Handlebars.registerHelper('pluralize', function(itemCount, singular, plural){

            var display = itemCount != 1 ? plural : singular;
            return new Handlebars.SafeString(display);
        });

        Handlebars.registerHelper('whatis', function(param) {
            if(console.log) console.log(param);
        });

        Handlebars.registerHelper('setContextValue', function(context, valueA, valueB) {
            context[valueA] = valueB;
        });

        // helper for recursive comments list partial include
        Handlebars.registerHelper('recursiveCommentsList', function(template, context, children) {
            var fn = Handlebars.partials[template];
            if (typeof fn !== 'function') {
                return "";
            }
            context.isRec = true;
            context.commentsCount = children.length;
            context.comments = children;
            context.pid = pageId;

            return new Handlebars.SafeString(fn(context));
        });

        // helper for new line to <br> conversion
        Handlebars.registerHelper('nl2br', function(str) {
            var breakTag = '<br>';
            var result = (str + '').replace(/([^>\r\n]?)(\r\n|\n\r|\r|\n)/g, '$1' + breakTag + '$2');
            return new Handlebars.SafeString(result);
        });

        // helper for global alert display
        Handlebars.registerHelper('showGlobalAlert', function(msg) {
            Social.Utils.showGlobalAlert(msg);
            return '';
        });

        // register handlebars partials
        Social.$('.hdb-partial').each(function(idx, it){
            var partialAccessor = Social.$(it).attr('data-hdbname');
            Handlebars.registerPartial(partialAccessor, Social.$(it).html());
        });
    }

    if( typeof jQuery !== 'undefined' && typeof window.$ !== 'undefined' && typeof window.$.ajax !== 'undefined' ){

        if(typeof Social.$ === 'undefined' || typeof window.Social.$ === 'undefined'){

            Social.$ = jQuery.noConflict(true);
            if(!jQuery){
                window.$ = jQuery = Social.$;
            }
        }

        // load handlebars.js templates
        Social.Utils.ajax({
            url: Social.Config.baseUrl + Social.Config.services.app.templates,
            method: 'GET',
            data: {},
            success: function(data){

                Social.$('body').append(data.html);
                initHandlebars();
                if(pageId){
                    Social.Session.init(pageId);
                }
            }
        });

        Social.onLoad();
    }


};





