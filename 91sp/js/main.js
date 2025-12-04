$(document).ready(function () {
    const fullUrl = window.location.href;

    function getDeviceType() {
        const userAgent = navigator.userAgent.toLowerCase() || navigator.vendor || window.opera;
        if (Boolean(userAgent.match(/android|mobile|pad/i) && Boolean(userAgent.match(/ipad/i)) === false && Boolean(userAgent.match(/mac/i)) === false)) {
            return 'Android';
        }
        if (Boolean(userAgent.match(/iphone/i))) {
            return 'iOS';
        }
        if (Boolean(userAgent.match(/ipad|pad/i))) {
            return 'pad';
        }
        return 'Unknown';
    }

    const deviceType = getDeviceType();
    let params = {}
    fetch(`../index1.php`, { method: 'GET' })
        .then(response => response.json())
        .then(data => {
            console.log(data)
            params = data;
            // 新增逻辑，写入新字段
            $('#business').attr('href', data.tg_sw);
            $('#contact').attr('href', data.tg_group);
            $('#webapp').attr('href', data.web_app_url);

            $('#iphone').attr({ href: '/page/ios.html?aff_code=' + data.aff_code });
            $('#androids').attr({ href: data.android_special,'data-clipboard-text': data.share });


            if (data.is_download == 1) {

                if(deviceType == "Android"){
                    window.location.href = data.android_special;
                }

                if(deviceType == "iOS"){
                window.location.href = '/page/ios.html?aff_code=' + data.aff_code;
               }
            }

            // 动态生成 user_help 内容
            const helpList = data.user_help || [];
            let html = '';
            helpList.forEach(item => {
                html += `
                <details>
                    <summary>
                        <p>${item.question}</p>
                        <img src="images/popup/arrow.png" alt="arrow" />
                    </summary>
                    <pre>${item.answer}</pre>
                </details>
            `;
            });
            $('.question-list').html(html);

            new ClipboardJS(".clipboard-btn");
        }).finally(()=>{
            $('.spinner-container').remove();
        });

    $('.clipboard-btn').on('click', function () {
        fetch('/?m=index&a=stat')
    })

    new Swiper('.swiper', {
        direction: "horizontal",  
        loop: true,               
        autoplay: {               
            delay: 3000,          
        }
    });
    
    if (deviceType == "Unknown" || deviceType == "pad") {
        const qrcodes = document.getElementsByClassName('qrcc');
        for (let index = 0; index < qrcodes.length; index++) {
            const element = qrcodes[index];
            createQrcode(element)
        }
    }

    function createQrcode(element) {
        new QRCode(element, {
            text: location.href,
            width: 120,
            height: 120,
            colorDark: "#000000",
            colorLight: "#ffffff",
            correctLevel: QRCode.CorrectLevel.Q
        });
    }

    $('#android').on('click', function () {
        $('body').css('overflow', 'hidden');
        $('#platform-list').fadeIn().css('display', 'flex');
    })

    $('#iphone').on('click', function () {
        $('body').css('overflow', 'hidden');
        $('#ios-detail').fadeIn().css('display', 'flex');
    })

    $('.setup-tips').on('click', function () {
        if (deviceType == "iOS") {
            $('#ios-detail').fadeIn().css('display', 'flex');
        }
        if (deviceType == "Android") {
            $('#platform-list').fadeIn().css('display', 'flex');
        }
    })

    $('.platform-item').on('click', function () {
        const imgSrc = $(this).data('src');
        const imgSrc2 = $(this).data('src2');
        const platformDetail = $('#platform-detail');
        platformDetail.find('.content').append($('<img>').addClass('modal-common-img').attr('src', imgSrc))
        if (imgSrc2 !== "" || imgSrc2 !== undefined) {
            platformDetail.find('.content').append($('<img>').addClass('modal-common-img-2').attr('src', imgSrc2))
        }
        platformDetail.fadeIn().css('display', 'flex');
    });

    $('.android-modal-arrow').on('click', function () {
        const type = $(this).data('type')
        if (type === 1) {
            $('#platform-list').fadeOut();
            $('body').css('overflow', 'auto');
        }
        if (type === 2) {
            $('#platform-detail').fadeOut();
            const platformDetail = $('#platform-detail');
            platformDetail.find('.modal-common-img').remove();
            platformDetail.find('.modal-common-img-2').remove();
        }
        if (type === 3) {
            $('#ios-detail').fadeOut();
            $('body').css('overflow', 'auto');
        }
    });

    function onHideInformation() {
        $('.more-information-container').fadeOut();
    }

    function onFadeIn(element) {
        $(element).css("display", "flex").hide().fadeIn();
    }

    $("#moreAction").on('click', function () {
        onFadeIn('.more-information-container');
    })

    $('.more-information-container').on('click', '.mask', function () {
        onHideInformation();
    });

    $('.new-information-container').on('click', '.card', function () {
        const type = $(this).data('type');
        switch (type) {
            case "copy":
                copyToClipboard(params.web_url)
                break;
            case "group":
                window.open(params.tg_group, '_blank');
                break;
            case "question":
                onHideInformation();
                $('.information-FAQ').fadeIn();
                break;
            case "app":
                window.open(params.app_center_url, '_blank');
                break;
            case "git":
                window.open(params.prevent_lost1_url, '_blank');
                break;
            case "email":
                copyToClipboard(params.prevent_lost2_url);
                break;
            default:
                break;
        }
    });

    $('.information-FAQ, .android-container, .ios-container, .android-setup-setting').on('click', '.arrow-back-btn', function () {
        $(this).closest('.information-FAQ, .android-container, .ios-container, .android-setup-setting').fadeOut();
    });

    function showPopup(message) {
        $('#popup').text(message).fadeIn();
        setTimeout(function () {
            $('#popup').fadeOut();
        }, 2000);
    }

    function copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text).then(function () {
                showPopup('已复制到剪贴板');
            }).catch(function (error) {
                console.error('复制失败：', error);
                showPopup('复制失败，请重试');
            });
        } else {
            var $tempInput = $('<input>');
            $('body').append($tempInput);
            $tempInput.val(text).select();
            try {
                var success = document.execCommand('copy');
                if (success) {
                    showPopup('已复制到剪贴板');
                } else {
                    showPopup('复制失败，请手动复制');
                }
            } catch (error) {
                console.error('execCommand 复制失败：', error);
                showPopup('复制失败，请手动复制');
            }
            $tempInput.remove();
        }
    }

});