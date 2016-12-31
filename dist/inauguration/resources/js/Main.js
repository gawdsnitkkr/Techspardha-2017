/**
 * Created by Kaushik on 12/29/2016.
 */
(function (d,$d,$w,$,t){
    var Globals = {
            IsMenuOpen: false,
            NumberofSlides: 0,
            CurrentSlideIndex: 0,
            SlideFraction: 0.33,
            LastPosition: 0
        },
        $Objects = {
            ActiveOption: null
        },
        Functions = {
            CloseMenu: function(){
                Globals.IsMenuOpen = false;
                $Objects.Menu.removeClass('open')
            },
            Initialize: function(){
                Globals.NumberofSlides = $Objects.Slides.length;
                var name, i;
                $Objects.MenuList.html('');
                for(i = 0; i < Globals.NumberofSlides; i++){
                    name = $($Objects.Slides[i]).find('h1').html();
                    var option = $('<li><span>'+ name +'</span></li>')
                        .bind('click', function(){
                            t.to($Objects.ForegroundContainer, 0.5, {
                                scrollTop: $(this).index() * $w.innerHeight(),
                                ease: Power2.easeOut
                            });
                        });
                    if(i === 0){
                        option.addClass('active');
                        $Objects.ActiveOption = option;
                    }
                    $Objects.MenuList.append(option);
                }
                if($w.innerWidth() <= 768)
                    t.set($Objects.MenuButton, {
                        display: 'block'
                    });
                else
                    t.set($Objects.MenuButton, {
                        display: 'none'
                    });
            },
            OpenMenu: function(){
                Globals.IsMenuOpen = true;
                $Objects.Menu.addClass('open')
            },
            ScrollSlidesUp: function(){
                var scrollHeight = $Objects.ForegroundContainer.scrollTop();
                console.log(scrollHeight);
            },
            ScrollSlidesDown: function(){
                var scrollHeight = $Objects.ForegroundContainer.scrollTop();
                console.log(scrollHeight);
            }
        };
    $d.ready(function(){
        $Objects.ForegroundContainer = $('.foreground-wrapper');
        $Objects.SlidesContainer = $('.foreground');
        $Objects.Slides = $('.workshop-panel');
        $Objects.MenuButton = $('#menu-button');
        $Objects.MenuButton.on('click', function(){
                if(Globals.IsMenuOpen === false)    Functions.OpenMenu();
                else if(Globals.IsMenuOpen === true)    Functions.CloseMenu();
            });
        $Objects.Menu = $('#scroll--navigation');
        $Objects.MenuList = $('ul', $Objects.Menu);
        $w.on('resize', function (){
            if($w.innerWidth() > 768){
                t.set($Objects.MenuButton, {
                    display: 'none'
                });
            }
            else if($w.innerWidth() <= 768){
                t.set($Objects.MenuButton, {
                    display: 'block'
                });
            }
            t.to($Objects.ForegroundContainer, 0.5, {
                scrollTop: Globals.CurrentSlideIndex * $w.innerHeight(),
                ease: Power2.easeOut
            });
        });
        $Objects.ForegroundContainer.scroll(function(){
            var s = $Objects.ForegroundContainer.scrollTop(),
                index = Math.floor(s / $w.innerHeight());
            if(index > Globals.CurrentSlideIndex) {
                Globals.CurrentSlideIndex = index;
                $Objects.ActiveOption.removeClass('active');
                $Objects.ActiveOption = $($Objects.MenuList.children()[Globals.CurrentSlideIndex]);
                $Objects.ActiveOption.addClass('active');
            } else if(index < Globals.CurrentSlideIndex){
                Globals.CurrentSlideIndex = index;
                $Objects.ActiveOption.removeClass('active');
                $Objects.ActiveOption = $($Objects.MenuList.children()[Globals.CurrentSlideIndex]);
                $Objects.ActiveOption.addClass('active');
            }
        });
        Functions.Initialize();
    });
})(document, jQuery(document), jQuery(window), jQuery, TweenMax);