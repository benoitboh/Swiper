/*
 * Swiper 1.2 - Mobile Touch Slider
 * http://www.idangero.us/sliders/swiper/
 *
 * Copyright 2012, Vladimir Kharlampidi
 * The iDangero.us
 * http://www.idangero.us/
 *
 * Licensed under GPL & MIT
 *
 * Released on: March 31, 2012
*/
Swiper = function(selector, params, callback) {
	if (!document.querySelectorAll||document.querySelectorAll(selector).length==0) return;
	function dQ(s) {
		return document.querySelectorAll(s)
	}
	var _this = this
	_this.touches = {};
	_this.positions = {};
	_this.times = {};
	_this.isTouched = false;
	_this.activeSlide = 0;
	_this.use3D = _this.isSupport3D()
	params = params || {};
	_this.params = params;

	//Default Parameters
	params.mode = params.mode || "horizontal";
	params.ratio = params.ratio || 1;
	params.speed = params.speed || 300;
	params.freeMode = params.freeMode || false;
	params.freeModeFluid = params.freeModeFluid || false;
	if (params.simulateTouch === false) params.simulateTouch = false
	else params.simulateTouch = true
	if (params.followFinger === false) params.followFinger = false
	else params.followFinger = true
	
	//AutoPlay
	params.autoPlay = params.autoPlay || false
	
	//Only External Control
	params.onlyExternal = params.onlyExternal || false
	//Pagination
	if (params.createPagination === false) params.createPagination = false
	else params.createPagination = true
	
	params.pagination = params.pagination || false
	//Default Element Classes
	params.slideClass = params.slideClass || 'swiper-slide'
	params.wrapperClass = params.wrapperClass || 'swiper-wrapper'
	params.paginationClass = params.paginationClass || 'swiper-pagination-switch';
	params.paginationActiveClass = params.paginationActiveClass || 'swiper-active-switch';
	
	//Default Params and Vars
	var	wrapper = dQ(selector+' .'+params.wrapperClass).item(0), isHorizontal,
	 sliderSize, numOfSlides, wrapperSize, direction, isScrolling;
	
	//Wrapper
	_this.wrapper = wrapper;
	 
	//Mode
	isHorizontal = params.mode == 'horizontal';
		
	//Define Touch Events
	var touchEvents = {
		touchStart : _this.isSupportTouch() || !params.simulateTouch  ? 'touchstart' : 'mousedown',
		touchMove : _this.isSupportTouch() || !params.simulateTouch ? 'touchmove' : 'mousemove',
		touchEnd : _this.isSupportTouch() || !params.simulateTouch ? 'touchend' : 'mouseup'
	};
	
	
	//Init Function
	_this.init = function() {
		var sliderWidth = dQ(selector).item(0).offsetWidth;
		var sliderHeight = dQ(selector).item(0).offsetHeight;
		sliderSize = isHorizontal ? sliderWidth : sliderHeight;
		numOfSlides = dQ(selector + ' .' + params.slideClass).length
		
		for (var i=0; i<numOfSlides; i++ ) {
			dQ(selector + ' .' + params.slideClass).item(i).style.width=sliderWidth+"px"
			dQ(selector + ' .' + params.slideClass).item(i).style.height=sliderHeight+"px"
		}
		var wrapperWidth = numOfSlides*sliderWidth;
		var wrapperHeight = numOfSlides*sliderHeight;
		wrapperSize = isHorizontal ? wrapperWidth : wrapperHeight;
		if (isHorizontal) {
			wrapper.style.width = wrapperWidth+"px";
		}
		else {
			wrapper.style.height = wrapperHeight+"px"
		}
	}
	_this.init()
	
	//Pagination
	if (params.pagination && params.createPagination) {
		var paginationHTML = ""
		for (var i = 0; i < numOfSlides; i++) {
			var addClass = "";
			if (i==0) addClass = ' '+params.paginationActiveClass;
			paginationHTML += '<span class="'+params.paginationClass+''+addClass+'"></span>'
		}
		dQ(params.pagination)[0].innerHTML = paginationHTML
	}
	
	//Window Resize Re-init
	window.addEventListener('resize', function(){ _this.init() }, false)
	
	//Autoplay
	var autoPlay
	_this.startAutoPlay = function() {
		if (params.autoPlay) {
			autoPlay = setInterval(function(){
				var newSlide = _this.activeSlide + 1
				if ( newSlide == numOfSlides) newSlide = 0 
				_this.swipeTo(newSlide) 
			}, params.autoPlay)
		}
	}
	_this.stopAutoPlay = function() {
		if (autoPlay)
			clearInterval(autoPlay)
	}
	if (params.autoPlay) {
		_this.startAutoPlay()
	}
	
	//Event Listeners
	wrapper.addEventListener(touchEvents.touchStart, function(event) {
		if (_this.isTouched || params.onlyExternal) {
			return false
		}
		_this.isTouched = true
		onTouchStart(event)
	}, false);
	
	//Mouse 'mousemove' and 'mouseout' events should be assigned to document
	var lestenEl = _this.isSupportTouch() ? wrapper : document
	
	lestenEl.addEventListener(touchEvents.touchMove, function(event) {
		if (_this.isTouched && !params.onlyExternal)	
			onTouchMove(event)
	}, false);
	
	lestenEl.addEventListener(touchEvents.touchEnd, function(event) {
		if ( params.onlyExternal || !_this.isTouched ) return
		_this.isTouched = false
		onTouchEnd(event)
	}, false);
	
	
	//Event Handlers
	function onTouchStart(event) {
		if (!_this.isSupportTouch() || event.targetTouches.length == 1 ) {
			
			if(!_this.isSupportTouch()) event.preventDefault()
			
			//Start Touches to check the scrolling
			_this.touches.startX = _this.touches.currentX = _this.isSupportTouch() ? event.targetTouches[0].pageX : event.pageX;
			_this.touches.startY = _this.touches.currentY = _this.isSupportTouch() ? event.targetTouches[0].pageY : event.pageY;
			
			_this.touches.start = _this.touches.current = isHorizontal ? _this.touches.startX : _this.touches.startY ;
			
			//Set Transition Time to 0
			_this.setTransition(0)
			
			//Get Start Translate Position
			_this.positions.start = _this.positions.current = isHorizontal ? _this.getTranslate('x') : _this.getTranslate('y');
			
			//Set Transform
			if (isHorizontal) {
				_this.setTransform( _this.positions.start, 0, 0)
			}
			else {
				_this.setTransform( 0, _this.positions.start, 0)
			}
			
			//TouchStartTime
			var tst = new Date()
			_this.times.start = tst.getTime()
			
			//Unset Scrolling
			isScrolling = undefined;
			
			//CallBack
			if (params.onTouchStart) params.onTouchStart(_this)
		}
	}
	function onTouchMove(event) {
		
		//check for scrolling
		if (_this.isSupportTouch()) {
		    if ( typeof isScrolling == 'undefined' && isHorizontal) {
		      isScrolling = !!( isScrolling || Math.abs(event.targetTouches[0].pageY - _this.touches.startY) > Math.abs( event.targetTouches[0].pageX - _this.touches.startX ) )
		    }
		    if ( typeof isScrolling == 'undefined' && !isHorizontal) {
		      isScrolling = !!( isScrolling || Math.abs(event.targetTouches[0].pageY - _this.touches.startY) < Math.abs( event.targetTouches[0].pageX - _this.touches.startX ) )
		    }
			if (isScrolling ) return
		}
		
		//Stop AutoPlay if exist
		if (params.autoPlay) {
			_this.stopAutoPlay()
		}
		
		if (!_this.isSupportTouch() || event.touches.length == 1) {
						
			event.preventDefault()
			
			if (params.onTouchMove) params.onTouchMove(_this)
			
			_this.touches.current = isHorizontal ? (_this.isSupportTouch() ? event.targetTouches[0].pageX : event.pageX) : (_this.isSupportTouch() ? event.targetTouches[0].pageY : event.pageY) ;
			
			
			_this.positions.current = (_this.touches.current - _this.touches.start)*params.ratio + _this.positions.start			
			
			//Resistance for Negative-Back sliding
			if(_this.positions.current > 0 && !(params.freeMode&&!params.freeModeFluid)) {
				var resistance = (sliderSize*2-_this.positions.current)/sliderSize/2;
				if (resistance < 0.5) 
					_this.positions.current = (sliderSize/2)
				else 
					_this.positions.current = _this.positions.current * resistance
				
			}
			//Resistance for After-End Sliding
			if ( Math.abs(_this.positions.current) > (wrapperSize-sliderSize) && !(params.freeMode&&!params.freeModeFluid)) {

				var resistance = ((wrapperSize-sliderSize)+_this.positions.current)/(wrapperSize-sliderSize)/2;
				var newPos = _this.positions.current - sliderSize* resistance*(numOfSlides-1)
				var stopPos = -(wrapperSize-sliderSize/2)
				if (newPos < stopPos)
					_this.positions.current = stopPos
				else 
					_this.positions.current = newPos
			}
			
			//Move Slides
			if (!params.followFinger) return
			if (isHorizontal) _this.setTransform( _this.positions.current, 0, 0)
			else _this.setTransform( 0, _this.positions.current, 0)
			
			if (params.freeMode) {
				_this.updateActiveSlide(_this.positions.current)
			}
		}
	}
	function onTouchEnd(event) {
		//Check for Current Objs
		if (!_this.positions.current) {
			_this.positions.current = _this.positions.start	
		}
		
		//--
		if (isHorizontal) _this.setTransform( _this.positions.current, 0, 0)
		else _this.setTransform( 0, _this.positions.current, 0)
		//--
		
		// TouchEndTime
		var tet = new Date()
		_this.times.end = tet.getTime();
		
		//Difference
		_this.touches.diff = _this.touches.current - _this.touches.start		
		_this.touches.abs = Math.abs(_this.touches.diff)
		
		_this.positions.diff = _this.positions.current - _this.positions.start
		_this.positions.abs = Math.abs(_this.positions.diff)
		
		var diff = _this.positions.diff ;
		var diffAbs =_this.positions.abs ;

		if(diffAbs < 5) {
			_this.swipeReset()
		}
		var maxPosition = wrapperSize - sliderSize
		
		
		//Prevent Negative Back Sliding
		if (_this.positions.current > 0) {
			_this.swipeReset("-1")
			if (params.onTouchEnd) params.onTouchEnd(_this)
			return
		}
		//Prevent After-End Sliding
		if (Math.abs(_this.positions.current) > maxPosition) {
			_this.swipeReset("+1")
			if (params.onTouchEnd) params.onTouchEnd(_this)
			return
		}
		
		//Free Mode
		if (params.freeMode) {
			if ( (_this.times.end - _this.times.start) < 300 && params.freeModeFluid ) {
				var newPosition = _this.positions.current + _this.touches.diff * 2 ;
				if (newPosition < maxPosition*(-1)) newPosition = -maxPosition;
				if (newPosition > 0) newPosition = 0;
				if (isHorizontal)
					_this.setTransform( newPosition, 0, 0)
				else 
					_this.setTransform( 0, newPosition, 0)
					
				_this.setTransition( (_this.times.end - _this.times.start)*2 )
				_this.updateActiveSlide(newPosition)
			}
			if (!params.freeModeFluid || (_this.times.end - _this.times.start) >= 300) _this.updateActiveSlide(_this.positions.current)
			if (params.onTouchEnd) params.onTouchEnd(_this)
			return
		}
		
		//Direction
		direction = diff < 0 ? "toNext" : "toPrev"
		
		//Short Touches
		if (direction=="toNext" && ( _this.times.end - _this.times.start <= 300 ) ) {
			if (diffAbs < 30) _this.swipeReset()
			else _this.swipeNext();
		}
		
		if (direction=="toPrev" && ( _this.times.end - _this.times.start <= 300 ) ) {
		
			if (diffAbs < 30) _this.swipeReset()
			else _this.swipePrev();
		}
		
		//Long Touches
		if (direction=="toNext" && ( _this.times.end - _this.times.start > 300 ) ) {
			if (diffAbs >= sliderSize*0.5) {
				_this.swipeNext();
			}
			else {
				_this.swipeReset()
			}
		}
		if (direction=="toPrev" && ( _this.times.end - _this.times.start > 300 ) ) {
			if (diffAbs >= sliderSize*0.5) {
				_this.swipePrev();
			}
			else {
				_this.swipeReset()
			}
		}
		if (params.onTouchEnd) params.onTouchEnd(_this)
	}
	
	/* ---- Swipe Functions ----*/
	_this.swipeNext = function() {
		
		/* For external SwipeNext Function */
		if (!_this.positions.current) _this.positions.current = -sliderSize;
		//--
		var newPosition = Math.ceil(-_this.positions.current/sliderSize)*sliderSize
		if (newPosition==wrapperSize) return
		if (isHorizontal) {
			_this.setTransform(-newPosition,0,0)
		}
		else {
			_this.setTransform(0,-newPosition,0)
		}
		
		_this.setTransition( params.speed)
		
		/* For external swipeNext Function */
		_this.touches.start = _this.touches.current
		_this.positions.current-=sliderSize
		//--
		
		//Update Active Slide
		_this.updateActiveSlide(-newPosition)
		
		if (params.onSlideChange) {
			_this.transitionEnd(params.onSlideChange)
		}
		
	}
	
	_this.swipePrev = function() {
		
		var getTranslate = isHorizontal ? _this.getTranslate('x') : _this.getTranslate('y')
		if(getTranslate == 0) return
		var newPosition = (Math.ceil(-_this.positions.current/sliderSize)-1)*sliderSize
		/* For external swipePrev Function */
		if ( newPosition == - getTranslate   ) {
			newPosition = newPosition-sliderSize
			_this.positions.current = -newPosition
		}
		
		if (isHorizontal) {
			_this.setTransform(-newPosition,0,0)
		}
		else  {
			_this.setTransform(0,-newPosition,0)
		}		
		
		_this.setTransition( params.speed)
		//Update Active Slide
		_this.updateActiveSlide(-newPosition)
		if (params.onSlideChange)
			_this.transitionEnd(params.onSlideChange)
		
	}
	
	_this.swipeReset = function(prevention) {

		if (params.freeMode&&prevention) {
			if (prevention==="-1")  _this.positions.start = 0
			if (prevention==="+1")  {
				_this.positions.start = -wrapperSize+sliderSize
			}
		}
		var newPosition = _this.positions.current<0 ? Math.round(_this.positions.current/sliderSize)*sliderSize : 0
		if (newPosition == -wrapperSize) newPosition += sliderSize
		if (params.mode=='horizontal') {
			_this.setTransform(newPosition,0,0)
		}
		else {
			_this.setTransform(0,newPosition,0)
		}
		
		_this.setTransition( params.speed)
		
		//Update Active Slide
		_this.updateActiveSlide(newPosition)
	}
	
	_this.swipeTo = function (index) {
		if (index<0 || index > (numOfSlides-1)) return
		var newPosition =  -index*sliderSize ;
		_this.setTransform(newPosition,0,0)
		_this.setTransition( params.speed)	
		_this.updateActiveSlide(newPosition)
	}
	
	_this.updateActiveSlide = function(position) {
		_this.activeSlide = Math.round(-position/sliderSize)
		if (_this.activeSlide==numOfSlides) _this.activeSlide = numOfSlides-1
		if (_this.activeSlide<0) _this.activeSlide = 0

		//Update Pagination
		if (params.pagination) {
			_this.updatePagination()
		}
	}
	
	_this.updatePagination = function() {
		var activeSwitch = dQ(params.pagination+' .'+params.paginationActiveClass).item(0)
		if(!activeSwitch) return
		if (activeSwitch.className.indexOf('active')>=0) {
			activeSwitch.className = activeSwitch.className.replace(params.paginationActiveClass,'')
		}
		dQ(params.pagination+' .'+params.paginationClass).item( _this.activeSlide ).className = dQ(params.pagination+' .'+params.paginationClass).item( _this.activeSlide ).className+' '+params.paginationActiveClass
	}
}

Swiper.prototype = {

	//Transition End
	transitionEnd : function(callback) {
		var a = this
		var el = a.wrapper
		var events = ['webkitTransitionEnd','transitionend', 'oTransitionEnd', 'MSTransitionEnd'];
		if (callback) {
			function fireCallBack() {
				callback(a)
				for (var i=0; i<events.length; i++) {
					el.removeEventListener(events[i], fireCallBack, false)
				}
			}
			for (var i=0; i<events.length; i++) {
				el.addEventListener(events[i], fireCallBack, false)
			}
		}
	},
	
	//Touch Support
	isSupportTouch : function() {
		return ("ontouchstart" in window) || window.DocumentTouch && document instanceof DocumentTouch;
	},
		
	// 3D Transforms Test 
	isSupport3D : function() {
		var div = document.createElement('div');
		div.id = 'test3d';
			
		var s3d=false;	
		if("webkitPerspective" in div.style) s3d=true;
		if("MozPerspective" in div.style) s3d=true;
		if("OPerspective" in div.style) s3d=true;
		if("MsPerspective" in div.style) s3d=true;
		if("perspective" in div.style) s3d=true;

		/* Test with Media query for Webkit to prevent FALSE positive*/	
		if(s3d && ("webkitPerspective" in div.style) ) {
			
			var st = document.createElement('style');
			st.textContent = '@media (-webkit-transform-3d), (transform-3d), (-moz-transform-3d), (-o-transform-3d), (-ms-transform-3d) {#test3d{height:5px}}'
			document.getElementsByTagName('head')[0].appendChild(st);
			document.body.appendChild(div);
			
			s3d = div.offsetHeight === 5;;
			st.parentNode.removeChild(st);
			div.parentNode.removeChild(div);
		}
		return s3d;
	},
		
	//GetTranslate
	getTranslate : function(axis){
		var el = this.wrapper
		if (window.WebKitCSSMatrix) {
			var transformMatrix = new WebKitCSSMatrix(window.getComputedStyle(el, null).webkitTransform)
		}
		else {
			var transformMatrix = 	window.getComputedStyle(el, null).MozTransform || window.getComputedStyle(el, null).OTransform || window.getComputedStyle(el, null).MsTransform || window.getComputedStyle(el, null).transform
		}
		if (axis=='x') {
			var curTransform = parseInt( transformMatrix.toString().split(',')[4], 10 )
		}
		
		if (axis=='y') {
			var curTransform = parseInt( transformMatrix.toString().split(',')[5], 10 )
		}
		
		return curTransform;
	},
	
	//Set Transform
	setTransform : function(x,y,z) {
		var es = this.wrapper.style
		x=x||0;
		y=y||0;
		z=z||0;
		if (this.use3D) {
			es.webkitTransform = es.MsTransform = es.MozTransform = es.OTransform = es.transform = 'translate3d('+x+'px, '+y+'px, '+z+'px)'
		}
		else {
			es.webkitTransform = es.MsTransform = es.MozTransform = es.OTransform = es.transform = 'translate('+x+'px, '+y+'px)'
		}
	},
	
	//Set Transition
	setTransition : function(duration) {
		var es = this.wrapper.style
		es.webkitTransitionDuration = es.MsTransitionDuration = es.MozTransitionDuration = es.OTransitionDuration = es.transitionDuration = duration/1000+'s'
	}
	
}

//Small jQuery and Zepto Plugins
if (window.jQuery||window.Zepto) {
	(function($){
		$.fn.swiper = function(params) {
			return new Swiper($(this).selector, params)
		}
	})(window.jQuery||window.Zepto)
}



