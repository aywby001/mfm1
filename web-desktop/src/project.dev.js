require=(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"TimelineLite":[function(require,module,exports){
(function (global){
"use strict";
cc._RF.push(module, '4585dy8SspCGqTkA9WTYff/', 'TimelineLite');
// Script/lib/TimelineLite.js

"use strict";

/*!
 * VERSION: 1.19.1
 * DATE: 2017-01-17
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2017, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
var _gsScope = typeof module !== "undefined" && module.exports && typeof global !== "undefined" ? global : undefined || window; //helps ensure compatibility with AMD/RequireJS and CommonJS/Node
(_gsScope._gsQueue || (_gsScope._gsQueue = [])).push(function () {

	"use strict";

	_gsScope._gsDefine("TimelineLite", ["core.Animation", "core.SimpleTimeline", "TweenLite"], function (Animation, SimpleTimeline, TweenLite) {

		var TimelineLite = function TimelineLite(vars) {
			SimpleTimeline.call(this, vars);
			this._labels = {};
			this.autoRemoveChildren = this.vars.autoRemoveChildren === true;
			this.smoothChildTiming = this.vars.smoothChildTiming === true;
			this._sortChildren = true;
			this._onUpdate = this.vars.onUpdate;
			var v = this.vars,
			    val,
			    p;
			for (p in v) {
				val = v[p];
				if (_isArray(val)) if (val.join("").indexOf("{self}") !== -1) {
					v[p] = this._swapSelfInParams(val);
				}
			}
			if (_isArray(v.tweens)) {
				this.add(v.tweens, 0, v.align, v.stagger);
			}
		},
		    _tinyNum = 0.0000000001,
		    TweenLiteInternals = TweenLite._internals,
		    _internals = TimelineLite._internals = {},
		    _isSelector = TweenLiteInternals.isSelector,
		    _isArray = TweenLiteInternals.isArray,
		    _lazyTweens = TweenLiteInternals.lazyTweens,
		    _lazyRender = TweenLiteInternals.lazyRender,
		    _globals = _gsScope._gsDefine.globals,
		    _copy = function _copy(vars) {
			var copy = {},
			    p;
			for (p in vars) {
				copy[p] = vars[p];
			}
			return copy;
		},
		    _applyCycle = function _applyCycle(vars, targets, i) {
			var alt = vars.cycle,
			    p,
			    val;
			for (p in alt) {
				val = alt[p];
				vars[p] = typeof val === "function" ? val(i, targets[i]) : val[i % val.length];
			}
			delete vars.cycle;
		},
		    _pauseCallback = _internals.pauseCallback = function () {},
		    _slice = function _slice(a) {
			//don't use [].slice because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
			var b = [],
			    l = a.length,
			    i;
			for (i = 0; i !== l; b.push(a[i++])) {}
			return b;
		},
		    p = TimelineLite.prototype = new SimpleTimeline();

		TimelineLite.version = "1.19.1";
		p.constructor = TimelineLite;
		p.kill()._gc = p._forcingPlayhead = p._hasPause = false;

		/* might use later...
  //translates a local time inside an animation to the corresponding time on the root/global timeline, factoring in all nesting and timeScales.
  function localToGlobal(time, animation) {
  	while (animation) {
  		time = (time / animation._timeScale) + animation._startTime;
  		animation = animation.timeline;
  	}
  	return time;
  }
  	//translates the supplied time on the root/global timeline into the corresponding local time inside a particular animation, factoring in all nesting and timeScales
  function globalToLocal(time, animation) {
  	var scale = 1;
  	time -= localToGlobal(0, animation);
  	while (animation) {
  		scale *= animation._timeScale;
  		animation = animation.timeline;
  	}
  	return time * scale;
  }
  */

		p.to = function (target, duration, vars, position) {
			var Engine = vars.repeat && _globals.TweenMax || TweenLite;
			return duration ? this.add(new Engine(target, duration, vars), position) : this.set(target, vars, position);
		};

		p.from = function (target, duration, vars, position) {
			return this.add((vars.repeat && _globals.TweenMax || TweenLite).from(target, duration, vars), position);
		};

		p.fromTo = function (target, duration, fromVars, toVars, position) {
			var Engine = toVars.repeat && _globals.TweenMax || TweenLite;
			return duration ? this.add(Engine.fromTo(target, duration, fromVars, toVars), position) : this.set(target, toVars, position);
		};

		p.staggerTo = function (targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
			var tl = new TimelineLite({ onComplete: onCompleteAll, onCompleteParams: onCompleteAllParams, callbackScope: onCompleteAllScope, smoothChildTiming: this.smoothChildTiming }),
			    cycle = vars.cycle,
			    copy,
			    i;
			if (typeof targets === "string") {
				targets = TweenLite.selector(targets) || targets;
			}
			targets = targets || [];
			if (_isSelector(targets)) {
				//senses if the targets object is a selector. If it is, we should translate it into an array.
				targets = _slice(targets);
			}
			stagger = stagger || 0;
			if (stagger < 0) {
				targets = _slice(targets);
				targets.reverse();
				stagger *= -1;
			}
			for (i = 0; i < targets.length; i++) {
				copy = _copy(vars);
				if (copy.startAt) {
					copy.startAt = _copy(copy.startAt);
					if (copy.startAt.cycle) {
						_applyCycle(copy.startAt, targets, i);
					}
				}
				if (cycle) {
					_applyCycle(copy, targets, i);
					if (copy.duration != null) {
						duration = copy.duration;
						delete copy.duration;
					}
				}
				tl.to(targets[i], duration, copy, i * stagger);
			}
			return this.add(tl, position);
		};

		p.staggerFrom = function (targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
			vars.immediateRender = vars.immediateRender != false;
			vars.runBackwards = true;
			return this.staggerTo(targets, duration, vars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
		};

		p.staggerFromTo = function (targets, duration, fromVars, toVars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope) {
			toVars.startAt = fromVars;
			toVars.immediateRender = toVars.immediateRender != false && fromVars.immediateRender != false;
			return this.staggerTo(targets, duration, toVars, stagger, position, onCompleteAll, onCompleteAllParams, onCompleteAllScope);
		};

		p.call = function (callback, params, scope, position) {
			return this.add(TweenLite.delayedCall(0, callback, params, scope), position);
		};

		p.set = function (target, vars, position) {
			position = this._parseTimeOrLabel(position, 0, true);
			if (vars.immediateRender == null) {
				vars.immediateRender = position === this._time && !this._paused;
			}
			return this.add(new TweenLite(target, 0, vars), position);
		};

		TimelineLite.exportRoot = function (vars, ignoreDelayedCalls) {
			vars = vars || {};
			if (vars.smoothChildTiming == null) {
				vars.smoothChildTiming = true;
			}
			var tl = new TimelineLite(vars),
			    root = tl._timeline,
			    tween,
			    next;
			if (ignoreDelayedCalls == null) {
				ignoreDelayedCalls = true;
			}
			root._remove(tl, true);
			tl._startTime = 0;
			tl._rawPrevTime = tl._time = tl._totalTime = root._time;
			tween = root._first;
			while (tween) {
				next = tween._next;
				if (!ignoreDelayedCalls || !(tween instanceof TweenLite && tween.target === tween.vars.onComplete)) {
					tl.add(tween, tween._startTime - tween._delay);
				}
				tween = next;
			}
			root.add(tl, 0);
			return tl;
		};

		p.add = function (value, position, align, stagger) {
			var curTime, l, i, child, tl, beforeRawTime;
			if (typeof position !== "number") {
				position = this._parseTimeOrLabel(position, 0, true, value);
			}
			if (!(value instanceof Animation)) {
				if (value instanceof Array || value && value.push && _isArray(value)) {
					align = align || "normal";
					stagger = stagger || 0;
					curTime = position;
					l = value.length;
					for (i = 0; i < l; i++) {
						if (_isArray(child = value[i])) {
							child = new TimelineLite({ tweens: child });
						}
						this.add(child, curTime);
						if (typeof child !== "string" && typeof child !== "function") {
							if (align === "sequence") {
								curTime = child._startTime + child.totalDuration() / child._timeScale;
							} else if (align === "start") {
								child._startTime -= child.delay();
							}
						}
						curTime += stagger;
					}
					return this._uncache(true);
				} else if (typeof value === "string") {
					return this.addLabel(value, position);
				} else if (typeof value === "function") {
					value = TweenLite.delayedCall(0, value);
				} else {
					throw "Cannot add " + value + " into the timeline; it is not a tween, timeline, function, or string.";
				}
			}

			SimpleTimeline.prototype.add.call(this, value, position);

			//if the timeline has already ended but the inserted tween/timeline extends the duration, we should enable this timeline again so that it renders properly. We should also align the playhead with the parent timeline's when appropriate.
			if (this._gc || this._time === this._duration) if (!this._paused) if (this._duration < this.duration()) {
				//in case any of the ancestors had completed but should now be enabled...
				tl = this;
				beforeRawTime = tl.rawTime() > value._startTime; //if the tween is placed on the timeline so that it starts BEFORE the current rawTime, we should align the playhead (move the timeline). This is because sometimes users will create a timeline, let it finish, and much later append a tween and expect it to run instead of jumping to its end state. While technically one could argue that it should jump to its end state, that's not what users intuitively expect.
				while (tl._timeline) {
					if (beforeRawTime && tl._timeline.smoothChildTiming) {
						tl.totalTime(tl._totalTime, true); //moves the timeline (shifts its startTime) if necessary, and also enables it.
					} else if (tl._gc) {
						tl._enabled(true, false);
					}
					tl = tl._timeline;
				}
			}

			return this;
		};

		p.remove = function (value) {
			if (value instanceof Animation) {
				this._remove(value, false);
				var tl = value._timeline = value.vars.useFrames ? Animation._rootFramesTimeline : Animation._rootTimeline; //now that it's removed, default it to the root timeline so that if it gets played again, it doesn't jump back into this timeline.
				value._startTime = (value._paused ? value._pauseTime : tl._time) - (!value._reversed ? value._totalTime : value.totalDuration() - value._totalTime) / value._timeScale; //ensure that if it gets played again, the timing is correct.
				return this;
			} else if (value instanceof Array || value && value.push && _isArray(value)) {
				var i = value.length;
				while (--i > -1) {
					this.remove(value[i]);
				}
				return this;
			} else if (typeof value === "string") {
				return this.removeLabel(value);
			}
			return this.kill(null, value);
		};

		p._remove = function (tween, skipDisable) {
			SimpleTimeline.prototype._remove.call(this, tween, skipDisable);
			var last = this._last;
			if (!last) {
				this._time = this._totalTime = this._duration = this._totalDuration = 0;
			} else if (this._time > this.duration()) {
				this._time = this._duration;
				this._totalTime = this._totalDuration;
			}
			return this;
		};

		p.append = function (value, offsetOrLabel) {
			return this.add(value, this._parseTimeOrLabel(null, offsetOrLabel, true, value));
		};

		p.insert = p.insertMultiple = function (value, position, align, stagger) {
			return this.add(value, position || 0, align, stagger);
		};

		p.appendMultiple = function (tweens, offsetOrLabel, align, stagger) {
			return this.add(tweens, this._parseTimeOrLabel(null, offsetOrLabel, true, tweens), align, stagger);
		};

		p.addLabel = function (label, position) {
			this._labels[label] = this._parseTimeOrLabel(position);
			return this;
		};

		p.addPause = function (position, callback, params, scope) {
			var t = TweenLite.delayedCall(0, _pauseCallback, params, scope || this);
			t.vars.onComplete = t.vars.onReverseComplete = callback;
			t.data = "isPause";
			this._hasPause = true;
			return this.add(t, position);
		};

		p.removeLabel = function (label) {
			delete this._labels[label];
			return this;
		};

		p.getLabelTime = function (label) {
			return this._labels[label] != null ? this._labels[label] : -1;
		};

		p._parseTimeOrLabel = function (timeOrLabel, offsetOrLabel, appendIfAbsent, ignore) {
			var i;
			//if we're about to add a tween/timeline (or an array of them) that's already a child of this timeline, we should remove it first so that it doesn't contaminate the duration().
			if (ignore instanceof Animation && ignore.timeline === this) {
				this.remove(ignore);
			} else if (ignore && (ignore instanceof Array || ignore.push && _isArray(ignore))) {
				i = ignore.length;
				while (--i > -1) {
					if (ignore[i] instanceof Animation && ignore[i].timeline === this) {
						this.remove(ignore[i]);
					}
				}
			}
			if (typeof offsetOrLabel === "string") {
				return this._parseTimeOrLabel(offsetOrLabel, appendIfAbsent && typeof timeOrLabel === "number" && this._labels[offsetOrLabel] == null ? timeOrLabel - this.duration() : 0, appendIfAbsent);
			}
			offsetOrLabel = offsetOrLabel || 0;
			if (typeof timeOrLabel === "string" && (isNaN(timeOrLabel) || this._labels[timeOrLabel] != null)) {
				//if the string is a number like "1", check to see if there's a label with that name, otherwise interpret it as a number (absolute value).
				i = timeOrLabel.indexOf("=");
				if (i === -1) {
					if (this._labels[timeOrLabel] == null) {
						return appendIfAbsent ? this._labels[timeOrLabel] = this.duration() + offsetOrLabel : offsetOrLabel;
					}
					return this._labels[timeOrLabel] + offsetOrLabel;
				}
				offsetOrLabel = parseInt(timeOrLabel.charAt(i - 1) + "1", 10) * Number(timeOrLabel.substr(i + 1));
				timeOrLabel = i > 1 ? this._parseTimeOrLabel(timeOrLabel.substr(0, i - 1), 0, appendIfAbsent) : this.duration();
			} else if (timeOrLabel == null) {
				timeOrLabel = this.duration();
			}
			return Number(timeOrLabel) + offsetOrLabel;
		};

		p.seek = function (position, suppressEvents) {
			return this.totalTime(typeof position === "number" ? position : this._parseTimeOrLabel(position), suppressEvents !== false);
		};

		p.stop = function () {
			return this.paused(true);
		};

		p.gotoAndPlay = function (position, suppressEvents) {
			return this.play(position, suppressEvents);
		};

		p.gotoAndStop = function (position, suppressEvents) {
			return this.pause(position, suppressEvents);
		};

		p.render = function (time, suppressEvents, force) {
			if (this._gc) {
				this._enabled(true, false);
			}
			var totalDur = !this._dirty ? this._totalDuration : this.totalDuration(),
			    prevTime = this._time,
			    prevStart = this._startTime,
			    prevTimeScale = this._timeScale,
			    prevPaused = this._paused,
			    tween,
			    isComplete,
			    next,
			    callback,
			    internalForce,
			    pauseTween,
			    curTime;
			if (time >= totalDur - 0.0000001 && time >= 0) {
				//to work around occasional floating point math artifacts.
				this._totalTime = this._time = totalDur;
				if (!this._reversed) if (!this._hasPausedChild()) {
					isComplete = true;
					callback = "onComplete";
					internalForce = !!this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
					if (this._duration === 0) if (time <= 0 && time >= -0.0000001 || this._rawPrevTime < 0 || this._rawPrevTime === _tinyNum) if (this._rawPrevTime !== time && this._first) {
						internalForce = true;
						if (this._rawPrevTime > _tinyNum) {
							callback = "onReverseComplete";
						}
					}
				}
				this._rawPrevTime = this._duration || !suppressEvents || time || this._rawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
				time = totalDur + 0.0001; //to avoid occasional floating point rounding errors - sometimes child tweens/timelines were not being fully completed (their progress might be 0.999999999999998 instead of 1 because when _time - tween._startTime is performed, floating point errors would return a value that was SLIGHTLY off). Try (999999999999.7 - 999999999999) * 1 = 0.699951171875 instead of 0.7.
			} else if (time < 0.0000001) {
				//to work around occasional floating point math artifacts, round super small values to 0.
				this._totalTime = this._time = 0;
				if (prevTime !== 0 || this._duration === 0 && this._rawPrevTime !== _tinyNum && (this._rawPrevTime > 0 || time < 0 && this._rawPrevTime >= 0)) {
					callback = "onReverseComplete";
					isComplete = this._reversed;
				}
				if (time < 0) {
					this._active = false;
					if (this._timeline.autoRemoveChildren && this._reversed) {
						//ensures proper GC if a timeline is resumed after it's finished reversing.
						internalForce = isComplete = true;
						callback = "onReverseComplete";
					} else if (this._rawPrevTime >= 0 && this._first) {
						//when going back beyond the start, force a render so that zero-duration tweens that sit at the very beginning render their start values properly. Otherwise, if the parent timeline's playhead lands exactly at this timeline's startTime, and then moves backwards, the zero-duration tweens at the beginning would still be at their end state.
						internalForce = true;
					}
					this._rawPrevTime = time;
				} else {
					this._rawPrevTime = this._duration || !suppressEvents || time || this._rawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration timeline or tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
					if (time === 0 && isComplete) {
						//if there's a zero-duration tween at the very beginning of a timeline and the playhead lands EXACTLY at time 0, that tween will correctly render its end values, but we need to keep the timeline alive for one more render so that the beginning values render properly as the parent's playhead keeps moving beyond the begining. Imagine obj.x starts at 0 and then we do tl.set(obj, {x:100}).to(obj, 1, {x:200}) and then later we tl.reverse()...the goal is to have obj.x revert to 0. If the playhead happens to land on exactly 0, without this chunk of code, it'd complete the timeline and remove it from the rendering queue (not good).
						tween = this._first;
						while (tween && tween._startTime === 0) {
							if (!tween._duration) {
								isComplete = false;
							}
							tween = tween._next;
						}
					}
					time = 0; //to avoid occasional floating point rounding errors (could cause problems especially with zero-duration tweens at the very beginning of the timeline)
					if (!this._initted) {
						internalForce = true;
					}
				}
			} else {

				if (this._hasPause && !this._forcingPlayhead && !suppressEvents) {
					if (time >= prevTime) {
						tween = this._first;
						while (tween && tween._startTime <= time && !pauseTween) {
							if (!tween._duration) if (tween.data === "isPause" && !tween.ratio && !(tween._startTime === 0 && this._rawPrevTime === 0)) {
								pauseTween = tween;
							}
							tween = tween._next;
						}
					} else {
						tween = this._last;
						while (tween && tween._startTime >= time && !pauseTween) {
							if (!tween._duration) if (tween.data === "isPause" && tween._rawPrevTime > 0) {
								pauseTween = tween;
							}
							tween = tween._prev;
						}
					}
					if (pauseTween) {
						this._time = time = pauseTween._startTime;
						this._totalTime = time + this._cycle * (this._totalDuration + this._repeatDelay);
					}
				}

				this._totalTime = this._time = this._rawPrevTime = time;
			}
			if ((this._time === prevTime || !this._first) && !force && !internalForce && !pauseTween) {
				return;
			} else if (!this._initted) {
				this._initted = true;
			}

			if (!this._active) if (!this._paused && this._time !== prevTime && time > 0) {
				this._active = true; //so that if the user renders the timeline (as opposed to the parent timeline rendering it), it is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the timeline already finished but the user manually re-renders it as halfway done, for example.
			}

			if (prevTime === 0) if (this.vars.onStart) if (this._time !== 0 || !this._duration) if (!suppressEvents) {
				this._callback("onStart");
			}

			curTime = this._time;
			if (curTime >= prevTime) {
				tween = this._first;
				while (tween) {
					next = tween._next; //record it here because the value could change after rendering...
					if (curTime !== this._time || this._paused && !prevPaused) {
						//in case a tween pauses or seeks the timeline when rendering, like inside of an onUpdate/onComplete
						break;
					} else if (tween._active || tween._startTime <= curTime && !tween._paused && !tween._gc) {
						if (pauseTween === tween) {
							this.pause();
						}
						if (!tween._reversed) {
							tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
						} else {
							tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
						}
					}
					tween = next;
				}
			} else {
				tween = this._last;
				while (tween) {
					next = tween._prev; //record it here because the value could change after rendering...
					if (curTime !== this._time || this._paused && !prevPaused) {
						//in case a tween pauses or seeks the timeline when rendering, like inside of an onUpdate/onComplete
						break;
					} else if (tween._active || tween._startTime <= prevTime && !tween._paused && !tween._gc) {
						if (pauseTween === tween) {
							pauseTween = tween._prev; //the linked list is organized by _startTime, thus it's possible that a tween could start BEFORE the pause and end after it, in which case it would be positioned before the pause tween in the linked list, but we should render it before we pause() the timeline and cease rendering. This is only a concern when going in reverse.
							while (pauseTween && pauseTween.endTime() > this._time) {
								pauseTween.render(pauseTween._reversed ? pauseTween.totalDuration() - (time - pauseTween._startTime) * pauseTween._timeScale : (time - pauseTween._startTime) * pauseTween._timeScale, suppressEvents, force);
								pauseTween = pauseTween._prev;
							}
							pauseTween = null;
							this.pause();
						}
						if (!tween._reversed) {
							tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
						} else {
							tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
						}
					}
					tween = next;
				}
			}

			if (this._onUpdate) if (!suppressEvents) {
				if (_lazyTweens.length) {
					//in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onUpdate on a timeline that reports/checks tweened values.
					_lazyRender();
				}
				this._callback("onUpdate");
			}

			if (callback) if (!this._gc) if (prevStart === this._startTime || prevTimeScale !== this._timeScale) if (this._time === 0 || totalDur >= this.totalDuration()) {
				//if one of the tweens that was rendered altered this timeline's startTime (like if an onComplete reversed the timeline), it probably isn't complete. If it is, don't worry, because whatever call altered the startTime would complete if it was necessary at the new time. The only exception is the timeScale property. Also check _gc because there's a chance that kill() could be called in an onUpdate
				if (isComplete) {
					if (_lazyTweens.length) {
						//in case rendering caused any tweens to lazy-init, we should render them because typically when a timeline finishes, users expect things to have rendered fully. Imagine an onComplete on a timeline that reports/checks tweened values.
						_lazyRender();
					}
					if (this._timeline.autoRemoveChildren) {
						this._enabled(false, false);
					}
					this._active = false;
				}
				if (!suppressEvents && this.vars[callback]) {
					this._callback(callback);
				}
			}
		};

		p._hasPausedChild = function () {
			var tween = this._first;
			while (tween) {
				if (tween._paused || tween instanceof TimelineLite && tween._hasPausedChild()) {
					return true;
				}
				tween = tween._next;
			}
			return false;
		};

		p.getChildren = function (nested, tweens, timelines, ignoreBeforeTime) {
			ignoreBeforeTime = ignoreBeforeTime || -9999999999;
			var a = [],
			    tween = this._first,
			    cnt = 0;
			while (tween) {
				if (tween._startTime < ignoreBeforeTime) {
					//do nothing
				} else if (tween instanceof TweenLite) {
					if (tweens !== false) {
						a[cnt++] = tween;
					}
				} else {
					if (timelines !== false) {
						a[cnt++] = tween;
					}
					if (nested !== false) {
						a = a.concat(tween.getChildren(true, tweens, timelines));
						cnt = a.length;
					}
				}
				tween = tween._next;
			}
			return a;
		};

		p.getTweensOf = function (target, nested) {
			var disabled = this._gc,
			    a = [],
			    cnt = 0,
			    tweens,
			    i;
			if (disabled) {
				this._enabled(true, true); //getTweensOf() filters out disabled tweens, and we have to mark them as _gc = true when the timeline completes in order to allow clean garbage collection, so temporarily re-enable the timeline here.
			}
			tweens = TweenLite.getTweensOf(target);
			i = tweens.length;
			while (--i > -1) {
				if (tweens[i].timeline === this || nested && this._contains(tweens[i])) {
					a[cnt++] = tweens[i];
				}
			}
			if (disabled) {
				this._enabled(false, true);
			}
			return a;
		};

		p.recent = function () {
			return this._recent;
		};

		p._contains = function (tween) {
			var tl = tween.timeline;
			while (tl) {
				if (tl === this) {
					return true;
				}
				tl = tl.timeline;
			}
			return false;
		};

		p.shiftChildren = function (amount, adjustLabels, ignoreBeforeTime) {
			ignoreBeforeTime = ignoreBeforeTime || 0;
			var tween = this._first,
			    labels = this._labels,
			    p;
			while (tween) {
				if (tween._startTime >= ignoreBeforeTime) {
					tween._startTime += amount;
				}
				tween = tween._next;
			}
			if (adjustLabels) {
				for (p in labels) {
					if (labels[p] >= ignoreBeforeTime) {
						labels[p] += amount;
					}
				}
			}
			return this._uncache(true);
		};

		p._kill = function (vars, target) {
			if (!vars && !target) {
				return this._enabled(false, false);
			}
			var tweens = !target ? this.getChildren(true, true, false) : this.getTweensOf(target),
			    i = tweens.length,
			    changed = false;
			while (--i > -1) {
				if (tweens[i]._kill(vars, target)) {
					changed = true;
				}
			}
			return changed;
		};

		p.clear = function (labels) {
			var tweens = this.getChildren(false, true, true),
			    i = tweens.length;
			this._time = this._totalTime = 0;
			while (--i > -1) {
				tweens[i]._enabled(false, false);
			}
			if (labels !== false) {
				this._labels = {};
			}
			return this._uncache(true);
		};

		p.invalidate = function () {
			var tween = this._first;
			while (tween) {
				tween.invalidate();
				tween = tween._next;
			}
			return Animation.prototype.invalidate.call(this);;
		};

		p._enabled = function (enabled, ignoreTimeline) {
			if (enabled === this._gc) {
				var tween = this._first;
				while (tween) {
					tween._enabled(enabled, true);
					tween = tween._next;
				}
			}
			return SimpleTimeline.prototype._enabled.call(this, enabled, ignoreTimeline);
		};

		p.totalTime = function (time, suppressEvents, uncapped) {
			this._forcingPlayhead = true;
			var val = Animation.prototype.totalTime.apply(this, arguments);
			this._forcingPlayhead = false;
			return val;
		};

		p.duration = function (value) {
			if (!arguments.length) {
				if (this._dirty) {
					this.totalDuration(); //just triggers recalculation
				}
				return this._duration;
			}
			if (this.duration() !== 0 && value !== 0) {
				this.timeScale(this._duration / value);
			}
			return this;
		};

		p.totalDuration = function (value) {
			if (!arguments.length) {
				if (this._dirty) {
					var max = 0,
					    tween = this._last,
					    prevStart = 999999999999,
					    prev,
					    end;
					while (tween) {
						prev = tween._prev; //record it here in case the tween changes position in the sequence...
						if (tween._dirty) {
							tween.totalDuration(); //could change the tween._startTime, so make sure the tween's cache is clean before analyzing it.
						}
						if (tween._startTime > prevStart && this._sortChildren && !tween._paused) {
							//in case one of the tweens shifted out of order, it needs to be re-inserted into the correct position in the sequence
							this.add(tween, tween._startTime - tween._delay);
						} else {
							prevStart = tween._startTime;
						}
						if (tween._startTime < 0 && !tween._paused) {
							//children aren't allowed to have negative startTimes unless smoothChildTiming is true, so adjust here if one is found.
							max -= tween._startTime;
							if (this._timeline.smoothChildTiming) {
								this._startTime += tween._startTime / this._timeScale;
							}
							this.shiftChildren(-tween._startTime, false, -9999999999);
							prevStart = 0;
						}
						end = tween._startTime + tween._totalDuration / tween._timeScale;
						if (end > max) {
							max = end;
						}
						tween = prev;
					}
					this._duration = this._totalDuration = max;
					this._dirty = false;
				}
				return this._totalDuration;
			}
			return value && this.totalDuration() ? this.timeScale(this._totalDuration / value) : this;
		};

		p.paused = function (value) {
			if (!value) {
				//if there's a pause directly at the spot from where we're unpausing, skip it.
				var tween = this._first,
				    time = this._time;
				while (tween) {
					if (tween._startTime === time && tween.data === "isPause") {
						tween._rawPrevTime = 0; //remember, _rawPrevTime is how zero-duration tweens/callbacks sense directionality and determine whether or not to fire. If _rawPrevTime is the same as _startTime on the next render, it won't fire.
					}
					tween = tween._next;
				}
			}
			return Animation.prototype.paused.apply(this, arguments);
		};

		p.usesFrames = function () {
			var tl = this._timeline;
			while (tl._timeline) {
				tl = tl._timeline;
			}
			return tl === Animation._rootFramesTimeline;
		};

		p.rawTime = function (wrapRepeats) {
			return wrapRepeats && (this._paused || this._repeat && this.time() > 0 && this.totalProgress() < 1) ? this._totalTime % (this._duration + this._repeatDelay) : this._paused ? this._totalTime : (this._timeline.rawTime(wrapRepeats) - this._startTime) * this._timeScale;
		};

		return TimelineLite;
	}, true);
});if (_gsScope._gsDefine) {
	_gsScope._gsQueue.pop()();
}

//export to AMD/RequireJS and CommonJS/Node (precursor to full modular build system coming at a later date)
(function (name) {
	"use strict";

	var getGlobal = function getGlobal() {
		return (_gsScope.GreenSockGlobals || _gsScope)[name];
	};
	if (typeof define === "function" && define.amd) {
		//AMD
		define(["TweenLite"], getGlobal);
	} else if (typeof module !== "undefined" && module.exports) {
		//node
		require("./TweenLite.js"); //dependency
		module.exports = getGlobal();
	}
})("TimelineLite");

cc._RF.pop();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./TweenLite.js":"TweenLite"}],"TweenLite":[function(require,module,exports){
(function (global){
"use strict";
cc._RF.push(module, '3780eJq/mpFYJUZolHhunZ2', 'TweenLite');
// Script/lib/TweenLite.js

"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*!
 * VERSION: 1.19.1
 * DATE: 2017-01-17
 * UPDATES AND DOCS AT: http://greensock.com
 *
 * @license Copyright (c) 2008-2017, GreenSock. All rights reserved.
 * This work is subject to the terms at http://greensock.com/standard-license or for
 * Club GreenSock members, the software agreement that was issued with your membership.
 * 
 * @author: Jack Doyle, jack@greensock.com
 */
(function (window, moduleName) {

	"use strict";

	var _exports = {},
	    _doc = window.document,
	    _globals = window.GreenSockGlobals = window.GreenSockGlobals || window;
	if (_globals.TweenLite) {
		return; //in case the core set of classes is already loaded, don't instantiate twice.
	}
	var _namespace = function _namespace(ns) {
		var a = ns.split("."),
		    p = _globals,
		    i;
		for (i = 0; i < a.length; i++) {
			p[a[i]] = p = p[a[i]] || {};
		}
		return p;
	},
	    gs = _namespace("com.greensock"),
	    _tinyNum = 0.0000000001,
	    _slice = function _slice(a) {
		//don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
		var b = [],
		    l = a.length,
		    i;
		for (i = 0; i !== l; b.push(a[i++])) {}
		return b;
	},
	    _emptyFunc = function _emptyFunc() {},
	    _isArray = function () {
		//works around issues in iframe environments where the Array global isn't shared, thus if the object originates in a different window/iframe, "(obj instanceof Array)" will evaluate false. We added some speed optimizations to avoid Object.prototype.toString.call() unless it's absolutely necessary because it's VERY slow (like 20x slower)
		var toString = Object.prototype.toString,
		    array = toString.call([]);
		return function (obj) {
			return obj != null && (obj instanceof Array || (typeof obj === "undefined" ? "undefined" : _typeof(obj)) === "object" && !!obj.push && toString.call(obj) === array);
		};
	}(),
	    a,
	    i,
	    p,
	    _ticker,
	    _tickerActive,
	    _defLookup = {},


	/**
  * @constructor
  * Defines a GreenSock class, optionally with an array of dependencies that must be instantiated first and passed into the definition.
  * This allows users to load GreenSock JS files in any order even if they have interdependencies (like CSSPlugin extends TweenPlugin which is
  * inside TweenLite.js, but if CSSPlugin is loaded first, it should wait to run its code until TweenLite.js loads and instantiates TweenPlugin
  * and then pass TweenPlugin to CSSPlugin's definition). This is all done automatically and internally.
  *
  * Every definition will be added to a "com.greensock" global object (typically window, but if a window.GreenSockGlobals object is found,
  * it will go there as of v1.7). For example, TweenLite will be found at window.com.greensock.TweenLite and since it's a global class that should be available anywhere,
  * it is ALSO referenced at window.TweenLite. However some classes aren't considered global, like the base com.greensock.core.Animation class, so
  * those will only be at the package like window.com.greensock.core.Animation. Again, if you define a GreenSockGlobals object on the window, everything
  * gets tucked neatly inside there instead of on the window directly. This allows you to do advanced things like load multiple versions of GreenSock
  * files and put them into distinct objects (imagine a banner ad uses a newer version but the main site uses an older one). In that case, you could
  * sandbox the banner one like:
  *
  * <script>
  *     var gs = window.GreenSockGlobals = {}; //the newer version we're about to load could now be referenced in a "gs" object, like gs.TweenLite.to(...). Use whatever alias you want as long as it's unique, "gs" or "banner" or whatever.
  * </script>
  * <script src="js/greensock/v1.7/TweenMax.js"></script>
  * <script>
  *     window.GreenSockGlobals = window._gsQueue = window._gsDefine = null; //reset it back to null (along with the special _gsQueue variable) so that the next load of TweenMax affects the window and we can reference things directly like TweenLite.to(...)
  * </script>
  * <script src="js/greensock/v1.6/TweenMax.js"></script>
  * <script>
  *     gs.TweenLite.to(...); //would use v1.7
  *     TweenLite.to(...); //would use v1.6
  * </script>
  *
  * @param {!string} ns The namespace of the class definition, leaving off "com.greensock." as that's assumed. For example, "TweenLite" or "plugins.CSSPlugin" or "easing.Back".
  * @param {!Array.<string>} dependencies An array of dependencies (described as their namespaces minus "com.greensock." prefix). For example ["TweenLite","plugins.TweenPlugin","core.Animation"]
  * @param {!function():Object} func The function that should be called and passed the resolved dependencies which will return the actual class for this definition.
  * @param {boolean=} global If true, the class will be added to the global scope (typically window unless you define a window.GreenSockGlobals object)
  */
	Definition = function Definition(ns, dependencies, func, global) {
		this.sc = _defLookup[ns] ? _defLookup[ns].sc : []; //subclasses
		_defLookup[ns] = this;
		this.gsClass = null;
		this.func = func;
		var _classes = [];
		this.check = function (init) {
			var i = dependencies.length,
			    missing = i,
			    cur,
			    a,
			    n,
			    cl,
			    hasModule;
			while (--i > -1) {
				if ((cur = _defLookup[dependencies[i]] || new Definition(dependencies[i], [])).gsClass) {
					_classes[i] = cur.gsClass;
					missing--;
				} else if (init) {
					cur.sc.push(this);
				}
			}
			if (missing === 0 && func) {
				a = ("com.greensock." + ns).split(".");
				n = a.pop();
				cl = _namespace(a.join("."))[n] = this.gsClass = func.apply(func, _classes);

				//exports to multiple environments
				if (global) {
					_globals[n] = _exports[n] = cl; //provides a way to avoid global namespace pollution. By default, the main classes like TweenLite, Power1, Strong, etc. are added to window unless a GreenSockGlobals is defined. So if you want to have things added to a custom object instead, just do something like window.GreenSockGlobals = {} before loading any GreenSock files. You can even set up an alias like window.GreenSockGlobals = windows.gs = {} so that you can access everything like gs.TweenLite. Also remember that ALL classes are added to the window.com.greensock object (in their respective packages, like com.greensock.easing.Power1, com.greensock.TweenLite, etc.)
					hasModule = typeof module !== "undefined" && module.exports;
					if (!hasModule && typeof define === "function" && define.amd) {
						//AMD
						define((window.GreenSockAMDPath ? window.GreenSockAMDPath + "/" : "") + ns.split(".").pop(), [], function () {
							return cl;
						});
					} else if (hasModule) {
						//node
						if (ns === moduleName) {
							module.exports = _exports[moduleName] = cl;
							for (i in _exports) {
								cl[i] = _exports[i];
							}
						} else if (_exports[moduleName]) {
							_exports[moduleName][n] = cl;
						}
					}
				}
				for (i = 0; i < this.sc.length; i++) {
					this.sc[i].check();
				}
			}
		};
		this.check(true);
	},


	//used to create Definition instances (which basically registers a class that has dependencies).
	_gsDefine = window._gsDefine = function (ns, dependencies, func, global) {
		return new Definition(ns, dependencies, func, global);
	},


	//a quick way to create a class that doesn't have any dependencies. Returns the class, but first registers it in the GreenSock namespace so that other classes can grab it (other classes might be dependent on the class).
	_class = gs._class = function (ns, func, global) {
		func = func || function () {};
		_gsDefine(ns, [], function () {
			return func;
		}, global);
		return func;
	};

	_gsDefine.globals = _globals;

	/*
  * ----------------------------------------------------------------
  * Ease
  * ----------------------------------------------------------------
  */
	var _baseParams = [0, 0, 1, 1],
	    _blankArray = [],
	    Ease = _class("easing.Ease", function (func, extraParams, type, power) {
		this._func = func;
		this._type = type || 0;
		this._power = power || 0;
		this._params = extraParams ? _baseParams.concat(extraParams) : _baseParams;
	}, true),
	    _easeMap = Ease.map = {},
	    _easeReg = Ease.register = function (ease, names, types, create) {
		var na = names.split(","),
		    i = na.length,
		    ta = (types || "easeIn,easeOut,easeInOut").split(","),
		    e,
		    name,
		    j,
		    type;
		while (--i > -1) {
			name = na[i];
			e = create ? _class("easing." + name, null, true) : gs.easing[name] || {};
			j = ta.length;
			while (--j > -1) {
				type = ta[j];
				_easeMap[name + "." + type] = _easeMap[type + name] = e[type] = ease.getRatio ? ease : ease[type] || new ease();
			}
		}
	};

	p = Ease.prototype;
	p._calcEnd = false;
	p.getRatio = function (p) {
		if (this._func) {
			this._params[0] = p;
			return this._func.apply(null, this._params);
		}
		var t = this._type,
		    pw = this._power,
		    r = t === 1 ? 1 - p : t === 2 ? p : p < 0.5 ? p * 2 : (1 - p) * 2;
		if (pw === 1) {
			r *= r;
		} else if (pw === 2) {
			r *= r * r;
		} else if (pw === 3) {
			r *= r * r * r;
		} else if (pw === 4) {
			r *= r * r * r * r;
		}
		return t === 1 ? 1 - r : t === 2 ? r : p < 0.5 ? r / 2 : 1 - r / 2;
	};

	//create all the standard eases like Linear, Quad, Cubic, Quart, Quint, Strong, Power0, Power1, Power2, Power3, and Power4 (each with easeIn, easeOut, and easeInOut)
	a = ["Linear", "Quad", "Cubic", "Quart", "Quint,Strong"];
	i = a.length;
	while (--i > -1) {
		p = a[i] + ",Power" + i;
		_easeReg(new Ease(null, null, 1, i), p, "easeOut", true);
		_easeReg(new Ease(null, null, 2, i), p, "easeIn" + (i === 0 ? ",easeNone" : ""));
		_easeReg(new Ease(null, null, 3, i), p, "easeInOut");
	}
	_easeMap.linear = gs.easing.Linear.easeIn;
	_easeMap.swing = gs.easing.Quad.easeInOut; //for jQuery folks


	/*
  * ----------------------------------------------------------------
  * EventDispatcher
  * ----------------------------------------------------------------
  */
	var EventDispatcher = _class("events.EventDispatcher", function (target) {
		this._listeners = {};
		this._eventTarget = target || this;
	});
	p = EventDispatcher.prototype;

	p.addEventListener = function (type, callback, scope, useParam, priority) {
		priority = priority || 0;
		var list = this._listeners[type],
		    index = 0,
		    listener,
		    i;
		if (this === _ticker && !_tickerActive) {
			_ticker.wake();
		}
		if (list == null) {
			this._listeners[type] = list = [];
		}
		i = list.length;
		while (--i > -1) {
			listener = list[i];
			if (listener.c === callback && listener.s === scope) {
				list.splice(i, 1);
			} else if (index === 0 && listener.pr < priority) {
				index = i + 1;
			}
		}
		list.splice(index, 0, { c: callback, s: scope, up: useParam, pr: priority });
	};

	p.removeEventListener = function (type, callback) {
		var list = this._listeners[type],
		    i;
		if (list) {
			i = list.length;
			while (--i > -1) {
				if (list[i].c === callback) {
					list.splice(i, 1);
					return;
				}
			}
		}
	};

	p.dispatchEvent = function (type) {
		var list = this._listeners[type],
		    i,
		    t,
		    listener;
		if (list) {
			i = list.length;
			if (i > 1) {
				list = list.slice(0); //in case addEventListener() is called from within a listener/callback (otherwise the index could change, resulting in a skip)
			}
			t = this._eventTarget;
			while (--i > -1) {
				listener = list[i];
				if (listener) {
					if (listener.up) {
						listener.c.call(listener.s || t, { type: type, target: t });
					} else {
						listener.c.call(listener.s || t);
					}
				}
			}
		}
	};

	/*
  * ----------------------------------------------------------------
  * Ticker
  * ----------------------------------------------------------------
  */
	var _reqAnimFrame = window.requestAnimationFrame,
	    _cancelAnimFrame = window.cancelAnimationFrame,
	    _getTime = Date.now || function () {
		return new Date().getTime();
	},
	    _lastUpdate = _getTime();

	//now try to determine the requestAnimationFrame and cancelAnimationFrame functions and if none are found, we'll use a setTimeout()/clearTimeout() polyfill.
	a = ["ms", "moz", "webkit", "o"];
	i = a.length;
	while (--i > -1 && !_reqAnimFrame) {
		_reqAnimFrame = window[a[i] + "RequestAnimationFrame"];
		_cancelAnimFrame = window[a[i] + "CancelAnimationFrame"] || window[a[i] + "CancelRequestAnimationFrame"];
	}

	_class("Ticker", function (fps, useRAF) {
		var _self = this,
		    _startTime = _getTime(),
		    _useRAF = useRAF !== false && _reqAnimFrame ? "auto" : false,
		    _lagThreshold = 500,
		    _adjustedLag = 33,
		    _tickWord = "tick",
		    //helps reduce gc burden
		_fps,
		    _req,
		    _id,
		    _gap,
		    _nextTime,
		    _tick = function _tick(manual) {
			var elapsed = _getTime() - _lastUpdate,
			    overlap,
			    dispatch;
			if (elapsed > _lagThreshold) {
				_startTime += elapsed - _adjustedLag;
			}
			_lastUpdate += elapsed;
			_self.time = (_lastUpdate - _startTime) / 1000;
			overlap = _self.time - _nextTime;
			if (!_fps || overlap > 0 || manual === true) {
				_self.frame++;
				_nextTime += overlap + (overlap >= _gap ? 0.004 : _gap - overlap);
				dispatch = true;
			}
			if (manual !== true) {
				//make sure the request is made before we dispatch the "tick" event so that timing is maintained. Otherwise, if processing the "tick" requires a bunch of time (like 15ms) and we're using a setTimeout() that's based on 16.7ms, it'd technically take 31.7ms between frames otherwise.
				_id = _req(_tick);
			}
			if (dispatch) {
				_self.dispatchEvent(_tickWord);
			}
		};

		EventDispatcher.call(_self);
		_self.time = _self.frame = 0;
		_self.tick = function () {
			_tick(true);
		};

		_self.lagSmoothing = function (threshold, adjustedLag) {
			_lagThreshold = threshold || 1 / _tinyNum; //zero should be interpreted as basically unlimited
			_adjustedLag = Math.min(adjustedLag, _lagThreshold, 0);
		};

		_self.sleep = function () {
			if (_id == null) {
				return;
			}
			if (!_useRAF || !_cancelAnimFrame) {
				clearTimeout(_id);
			} else {
				_cancelAnimFrame(_id);
			}
			_req = _emptyFunc;
			_id = null;
			if (_self === _ticker) {
				_tickerActive = false;
			}
		};

		_self.wake = function (seamless) {
			if (_id !== null) {
				_self.sleep();
			} else if (seamless) {
				_startTime += -_lastUpdate + (_lastUpdate = _getTime());
			} else if (_self.frame > 10) {
				//don't trigger lagSmoothing if we're just waking up, and make sure that at least 10 frames have elapsed because of the iOS bug that we work around below with the 1.5-second setTimout().
				_lastUpdate = _getTime() - _lagThreshold + 5;
			}
			_req = _fps === 0 ? _emptyFunc : !_useRAF || !_reqAnimFrame ? function (f) {
				return setTimeout(f, (_nextTime - _self.time) * 1000 + 1 | 0);
			} : _reqAnimFrame;
			if (_self === _ticker) {
				_tickerActive = true;
			}
			_tick(2);
		};

		_self.fps = function (value) {
			if (!arguments.length) {
				return _fps;
			}
			_fps = value;
			_gap = 1 / (_fps || 60);
			_nextTime = this.time + _gap;
			_self.wake();
		};

		_self.useRAF = function (value) {
			if (!arguments.length) {
				return _useRAF;
			}
			_self.sleep();
			_useRAF = value;
			_self.fps(_fps);
		};
		_self.fps(fps);

		//a bug in iOS 6 Safari occasionally prevents the requestAnimationFrame from working initially, so we use a 1.5-second timeout that automatically falls back to setTimeout() if it senses this condition.
		setTimeout(function () {
			if (_useRAF === "auto" && _self.frame < 5 && _doc.visibilityState !== "hidden") {
				_self.useRAF(false);
			}
		}, 1500);
	});

	p = gs.Ticker.prototype = new gs.events.EventDispatcher();
	p.constructor = gs.Ticker;

	/*
  * ----------------------------------------------------------------
  * Animation
  * ----------------------------------------------------------------
  */
	var Animation = _class("core.Animation", function (duration, vars) {
		this.vars = vars = vars || {};
		this._duration = this._totalDuration = duration || 0;
		this._delay = Number(vars.delay) || 0;
		this._timeScale = 1;
		this._active = vars.immediateRender === true;
		this.data = vars.data;
		this._reversed = vars.reversed === true;

		if (!_rootTimeline) {
			return;
		}
		if (!_tickerActive) {
			//some browsers (like iOS 6 Safari) shut down JavaScript execution when the tab is disabled and they [occasionally] neglect to start up requestAnimationFrame again when returning - this code ensures that the engine starts up again properly.
			_ticker.wake();
		}

		var tl = this.vars.useFrames ? _rootFramesTimeline : _rootTimeline;
		tl.add(this, tl._time);

		if (this.vars.paused) {
			this.paused(true);
		}
	});

	_ticker = Animation.ticker = new gs.Ticker();
	p = Animation.prototype;
	p._dirty = p._gc = p._initted = p._paused = false;
	p._totalTime = p._time = 0;
	p._rawPrevTime = -1;
	p._next = p._last = p._onUpdate = p._timeline = p.timeline = null;
	p._paused = false;

	//some browsers (like iOS) occasionally drop the requestAnimationFrame event when the user switches to a different tab and then comes back again, so we use a 2-second setTimeout() to sense if/when that condition occurs and then wake() the ticker.
	var _checkTimeout = function _checkTimeout() {
		if (_tickerActive && _getTime() - _lastUpdate > 2000) {
			_ticker.wake();
		}
		setTimeout(_checkTimeout, 2000);
	};
	_checkTimeout();

	p.play = function (from, suppressEvents) {
		if (from != null) {
			this.seek(from, suppressEvents);
		}
		return this.reversed(false).paused(false);
	};

	p.pause = function (atTime, suppressEvents) {
		if (atTime != null) {
			this.seek(atTime, suppressEvents);
		}
		return this.paused(true);
	};

	p.resume = function (from, suppressEvents) {
		if (from != null) {
			this.seek(from, suppressEvents);
		}
		return this.paused(false);
	};

	p.seek = function (time, suppressEvents) {
		return this.totalTime(Number(time), suppressEvents !== false);
	};

	p.restart = function (includeDelay, suppressEvents) {
		return this.reversed(false).paused(false).totalTime(includeDelay ? -this._delay : 0, suppressEvents !== false, true);
	};

	p.reverse = function (from, suppressEvents) {
		if (from != null) {
			this.seek(from || this.totalDuration(), suppressEvents);
		}
		return this.reversed(true).paused(false);
	};

	p.render = function (time, suppressEvents, force) {
		//stub - we override this method in subclasses.
	};

	p.invalidate = function () {
		this._time = this._totalTime = 0;
		this._initted = this._gc = false;
		this._rawPrevTime = -1;
		if (this._gc || !this.timeline) {
			this._enabled(true);
		}
		return this;
	};

	p.isActive = function () {
		var tl = this._timeline,
		    //the 2 root timelines won't have a _timeline; they're always active.
		startTime = this._startTime,
		    rawTime;
		return !tl || !this._gc && !this._paused && tl.isActive() && (rawTime = tl.rawTime(true)) >= startTime && rawTime < startTime + this.totalDuration() / this._timeScale;
	};

	p._enabled = function (enabled, ignoreTimeline) {
		if (!_tickerActive) {
			_ticker.wake();
		}
		this._gc = !enabled;
		this._active = this.isActive();
		if (ignoreTimeline !== true) {
			if (enabled && !this.timeline) {
				this._timeline.add(this, this._startTime - this._delay);
			} else if (!enabled && this.timeline) {
				this._timeline._remove(this, true);
			}
		}
		return false;
	};

	p._kill = function (vars, target) {
		return this._enabled(false, false);
	};

	p.kill = function (vars, target) {
		this._kill(vars, target);
		return this;
	};

	p._uncache = function (includeSelf) {
		var tween = includeSelf ? this : this.timeline;
		while (tween) {
			tween._dirty = true;
			tween = tween.timeline;
		}
		return this;
	};

	p._swapSelfInParams = function (params) {
		var i = params.length,
		    copy = params.concat();
		while (--i > -1) {
			if (params[i] === "{self}") {
				copy[i] = this;
			}
		}
		return copy;
	};

	p._callback = function (type) {
		var v = this.vars,
		    callback = v[type],
		    params = v[type + "Params"],
		    scope = v[type + "Scope"] || v.callbackScope || this,
		    l = params ? params.length : 0;
		switch (l) {//speed optimization; call() is faster than apply() so use it when there are only a few parameters (which is by far most common). Previously we simply did var v = this.vars; v[type].apply(v[type + "Scope"] || v.callbackScope || this, v[type + "Params"] || _blankArray);
			case 0:
				callback.call(scope);break;
			case 1:
				callback.call(scope, params[0]);break;
			case 2:
				callback.call(scope, params[0], params[1]);break;
			default:
				callback.apply(scope, params);
		}
	};

	//----Animation getters/setters --------------------------------------------------------

	p.eventCallback = function (type, callback, params, scope) {
		if ((type || "").substr(0, 2) === "on") {
			var v = this.vars;
			if (arguments.length === 1) {
				return v[type];
			}
			if (callback == null) {
				delete v[type];
			} else {
				v[type] = callback;
				v[type + "Params"] = _isArray(params) && params.join("").indexOf("{self}") !== -1 ? this._swapSelfInParams(params) : params;
				v[type + "Scope"] = scope;
			}
			if (type === "onUpdate") {
				this._onUpdate = callback;
			}
		}
		return this;
	};

	p.delay = function (value) {
		if (!arguments.length) {
			return this._delay;
		}
		if (this._timeline.smoothChildTiming) {
			this.startTime(this._startTime + value - this._delay);
		}
		this._delay = value;
		return this;
	};

	p.duration = function (value) {
		if (!arguments.length) {
			this._dirty = false;
			return this._duration;
		}
		this._duration = this._totalDuration = value;
		this._uncache(true); //true in case it's a TweenMax or TimelineMax that has a repeat - we'll need to refresh the totalDuration.
		if (this._timeline.smoothChildTiming) if (this._time > 0) if (this._time < this._duration) if (value !== 0) {
			this.totalTime(this._totalTime * (value / this._duration), true);
		}
		return this;
	};

	p.totalDuration = function (value) {
		this._dirty = false;
		return !arguments.length ? this._totalDuration : this.duration(value);
	};

	p.time = function (value, suppressEvents) {
		if (!arguments.length) {
			return this._time;
		}
		if (this._dirty) {
			this.totalDuration();
		}
		return this.totalTime(value > this._duration ? this._duration : value, suppressEvents);
	};

	p.totalTime = function (time, suppressEvents, uncapped) {
		if (!_tickerActive) {
			_ticker.wake();
		}
		if (!arguments.length) {
			return this._totalTime;
		}
		if (this._timeline) {
			if (time < 0 && !uncapped) {
				time += this.totalDuration();
			}
			if (this._timeline.smoothChildTiming) {
				if (this._dirty) {
					this.totalDuration();
				}
				var totalDuration = this._totalDuration,
				    tl = this._timeline;
				if (time > totalDuration && !uncapped) {
					time = totalDuration;
				}
				this._startTime = (this._paused ? this._pauseTime : tl._time) - (!this._reversed ? time : totalDuration - time) / this._timeScale;
				if (!tl._dirty) {
					//for performance improvement. If the parent's cache is already dirty, it already took care of marking the ancestors as dirty too, so skip the function call here.
					this._uncache(false);
				}
				//in case any of the ancestor timelines had completed but should now be enabled, we should reset their totalTime() which will also ensure that they're lined up properly and enabled. Skip for animations that are on the root (wasteful). Example: a TimelineLite.exportRoot() is performed when there's a paused tween on the root, the export will not complete until that tween is unpaused, but imagine a child gets restarted later, after all [unpaused] tweens have completed. The startTime of that child would get pushed out, but one of the ancestors may have completed.
				if (tl._timeline) {
					while (tl._timeline) {
						if (tl._timeline._time !== (tl._startTime + tl._totalTime) / tl._timeScale) {
							tl.totalTime(tl._totalTime, true);
						}
						tl = tl._timeline;
					}
				}
			}
			if (this._gc) {
				this._enabled(true, false);
			}
			if (this._totalTime !== time || this._duration === 0) {
				if (_lazyTweens.length) {
					_lazyRender();
				}
				this.render(time, suppressEvents, false);
				if (_lazyTweens.length) {
					//in case rendering caused any tweens to lazy-init, we should render them because typically when someone calls seek() or time() or progress(), they expect an immediate render.
					_lazyRender();
				}
			}
		}
		return this;
	};

	p.progress = p.totalProgress = function (value, suppressEvents) {
		var duration = this.duration();
		return !arguments.length ? duration ? this._time / duration : this.ratio : this.totalTime(duration * value, suppressEvents);
	};

	p.startTime = function (value) {
		if (!arguments.length) {
			return this._startTime;
		}
		if (value !== this._startTime) {
			this._startTime = value;
			if (this.timeline) if (this.timeline._sortChildren) {
				this.timeline.add(this, value - this._delay); //ensures that any necessary re-sequencing of Animations in the timeline occurs to make sure the rendering order is correct.
			}
		}
		return this;
	};

	p.endTime = function (includeRepeats) {
		return this._startTime + (includeRepeats != false ? this.totalDuration() : this.duration()) / this._timeScale;
	};

	p.timeScale = function (value) {
		if (!arguments.length) {
			return this._timeScale;
		}
		value = value || _tinyNum; //can't allow zero because it'll throw the math off
		if (this._timeline && this._timeline.smoothChildTiming) {
			var pauseTime = this._pauseTime,
			    t = pauseTime || pauseTime === 0 ? pauseTime : this._timeline.totalTime();
			this._startTime = t - (t - this._startTime) * this._timeScale / value;
		}
		this._timeScale = value;
		return this._uncache(false);
	};

	p.reversed = function (value) {
		if (!arguments.length) {
			return this._reversed;
		}
		if (value != this._reversed) {
			this._reversed = value;
			this.totalTime(this._timeline && !this._timeline.smoothChildTiming ? this.totalDuration() - this._totalTime : this._totalTime, true);
		}
		return this;
	};

	p.paused = function (value) {
		if (!arguments.length) {
			return this._paused;
		}
		var tl = this._timeline,
		    raw,
		    elapsed;
		if (value != this._paused) if (tl) {
			if (!_tickerActive && !value) {
				_ticker.wake();
			}
			raw = tl.rawTime();
			elapsed = raw - this._pauseTime;
			if (!value && tl.smoothChildTiming) {
				this._startTime += elapsed;
				this._uncache(false);
			}
			this._pauseTime = value ? raw : null;
			this._paused = value;
			this._active = this.isActive();
			if (!value && elapsed !== 0 && this._initted && this.duration()) {
				raw = tl.smoothChildTiming ? this._totalTime : (raw - this._startTime) / this._timeScale;
				this.render(raw, raw === this._totalTime, true); //in case the target's properties changed via some other tween or manual update by the user, we should force a render.
			}
		}
		if (this._gc && !value) {
			this._enabled(true, false);
		}
		return this;
	};

	/*
  * ----------------------------------------------------------------
  * SimpleTimeline
  * ----------------------------------------------------------------
  */
	var SimpleTimeline = _class("core.SimpleTimeline", function (vars) {
		Animation.call(this, 0, vars);
		this.autoRemoveChildren = this.smoothChildTiming = true;
	});

	p = SimpleTimeline.prototype = new Animation();
	p.constructor = SimpleTimeline;
	p.kill()._gc = false;
	p._first = p._last = p._recent = null;
	p._sortChildren = false;

	p.add = p.insert = function (child, position, align, stagger) {
		var prevTween, st;
		child._startTime = Number(position || 0) + child._delay;
		if (child._paused) if (this !== child._timeline) {
			//we only adjust the _pauseTime if it wasn't in this timeline already. Remember, sometimes a tween will be inserted again into the same timeline when its startTime is changed so that the tweens in the TimelineLite/Max are re-ordered properly in the linked list (so everything renders in the proper order).
			child._pauseTime = child._startTime + (this.rawTime() - child._startTime) / child._timeScale;
		}
		if (child.timeline) {
			child.timeline._remove(child, true); //removes from existing timeline so that it can be properly added to this one.
		}
		child.timeline = child._timeline = this;
		if (child._gc) {
			child._enabled(true, true);
		}
		prevTween = this._last;
		if (this._sortChildren) {
			st = child._startTime;
			while (prevTween && prevTween._startTime > st) {
				prevTween = prevTween._prev;
			}
		}
		if (prevTween) {
			child._next = prevTween._next;
			prevTween._next = child;
		} else {
			child._next = this._first;
			this._first = child;
		}
		if (child._next) {
			child._next._prev = child;
		} else {
			this._last = child;
		}
		child._prev = prevTween;
		this._recent = child;
		if (this._timeline) {
			this._uncache(true);
		}
		return this;
	};

	p._remove = function (tween, skipDisable) {
		if (tween.timeline === this) {
			if (!skipDisable) {
				tween._enabled(false, true);
			}

			if (tween._prev) {
				tween._prev._next = tween._next;
			} else if (this._first === tween) {
				this._first = tween._next;
			}
			if (tween._next) {
				tween._next._prev = tween._prev;
			} else if (this._last === tween) {
				this._last = tween._prev;
			}
			tween._next = tween._prev = tween.timeline = null;
			if (tween === this._recent) {
				this._recent = this._last;
			}

			if (this._timeline) {
				this._uncache(true);
			}
		}
		return this;
	};

	p.render = function (time, suppressEvents, force) {
		var tween = this._first,
		    next;
		this._totalTime = this._time = this._rawPrevTime = time;
		while (tween) {
			next = tween._next; //record it here because the value could change after rendering...
			if (tween._active || time >= tween._startTime && !tween._paused) {
				if (!tween._reversed) {
					tween.render((time - tween._startTime) * tween._timeScale, suppressEvents, force);
				} else {
					tween.render((!tween._dirty ? tween._totalDuration : tween.totalDuration()) - (time - tween._startTime) * tween._timeScale, suppressEvents, force);
				}
			}
			tween = next;
		}
	};

	p.rawTime = function () {
		if (!_tickerActive) {
			_ticker.wake();
		}
		return this._totalTime;
	};

	/*
  * ----------------------------------------------------------------
  * TweenLite
  * ----------------------------------------------------------------
  */
	var TweenLite = _class("TweenLite", function (target, duration, vars) {
		Animation.call(this, duration, vars);
		this.render = TweenLite.prototype.render; //speed optimization (avoid prototype lookup on this "hot" method)

		if (target == null) {
			throw "Cannot tween a null target.";
		}

		this.target = target = typeof target !== "string" ? target : TweenLite.selector(target) || target;

		var isSelector = target.jquery || target.length && target !== window && target[0] && (target[0] === window || target[0].nodeType && target[0].style && !target.nodeType),
		    overwrite = this.vars.overwrite,
		    i,
		    targ,
		    targets;

		this._overwrite = overwrite = overwrite == null ? _overwriteLookup[TweenLite.defaultOverwrite] : typeof overwrite === "number" ? overwrite >> 0 : _overwriteLookup[overwrite];

		if ((isSelector || target instanceof Array || target.push && _isArray(target)) && typeof target[0] !== "number") {
			this._targets = targets = _slice(target); //don't use Array.prototype.slice.call(target, 0) because that doesn't work in IE8 with a NodeList that's returned by querySelectorAll()
			this._propLookup = [];
			this._siblings = [];
			for (i = 0; i < targets.length; i++) {
				targ = targets[i];
				if (!targ) {
					targets.splice(i--, 1);
					continue;
				} else if (typeof targ === "string") {
					targ = targets[i--] = TweenLite.selector(targ); //in case it's an array of strings
					if (typeof targ === "string") {
						targets.splice(i + 1, 1); //to avoid an endless loop (can't imagine why the selector would return a string, but just in case)
					}
					continue;
				} else if (targ.length && targ !== window && targ[0] && (targ[0] === window || targ[0].nodeType && targ[0].style && !targ.nodeType)) {
					//in case the user is passing in an array of selector objects (like jQuery objects), we need to check one more level and pull things out if necessary. Also note that <select> elements pass all the criteria regarding length and the first child having style, so we must also check to ensure the target isn't an HTML node itself.
					targets.splice(i--, 1);
					this._targets = targets = targets.concat(_slice(targ));
					continue;
				}
				this._siblings[i] = _register(targ, this, false);
				if (overwrite === 1) if (this._siblings[i].length > 1) {
					_applyOverwrite(targ, this, null, 1, this._siblings[i]);
				}
			}
		} else {
			this._propLookup = {};
			this._siblings = _register(target, this, false);
			if (overwrite === 1) if (this._siblings.length > 1) {
				_applyOverwrite(target, this, null, 1, this._siblings);
			}
		}
		if (this.vars.immediateRender || duration === 0 && this._delay === 0 && this.vars.immediateRender !== false) {
			this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
			this.render(Math.min(0, -this._delay)); //in case delay is negative
		}
	}, true),
	    _isSelector = function _isSelector(v) {
		return v && v.length && v !== window && v[0] && (v[0] === window || v[0].nodeType && v[0].style && !v.nodeType); //we cannot check "nodeType" if the target is window from within an iframe, otherwise it will trigger a security error in some browsers like Firefox.
	},
	    _autoCSS = function _autoCSS(vars, target) {
		var css = {},
		    p;
		for (p in vars) {
			if (!_reservedProps[p] && (!(p in target) || p === "transform" || p === "x" || p === "y" || p === "width" || p === "height" || p === "className" || p === "border") && (!_plugins[p] || _plugins[p] && _plugins[p]._autoCSS)) {
				//note: <img> elements contain read-only "x" and "y" properties. We should also prioritize editing css width/height rather than the element's properties.
				css[p] = vars[p];
				delete vars[p];
			}
		}
		vars.css = css;
	};

	p = TweenLite.prototype = new Animation();
	p.constructor = TweenLite;
	p.kill()._gc = false;

	//----TweenLite defaults, overwrite management, and root updates ----------------------------------------------------

	p.ratio = 0;
	p._firstPT = p._targets = p._overwrittenProps = p._startAt = null;
	p._notifyPluginsOfEnabled = p._lazy = false;

	TweenLite.version = "1.19.1";
	TweenLite.defaultEase = p._ease = new Ease(null, null, 1, 1);
	TweenLite.defaultOverwrite = "auto";
	TweenLite.ticker = _ticker;
	TweenLite.autoSleep = 120;
	TweenLite.lagSmoothing = function (threshold, adjustedLag) {
		_ticker.lagSmoothing(threshold, adjustedLag);
	};

	TweenLite.selector = window.$ || window.jQuery || function (e) {
		var selector = window.$ || window.jQuery;
		if (selector) {
			TweenLite.selector = selector;
			return selector(e);
		}
		return typeof _doc === "undefined" ? e : _doc.querySelectorAll ? _doc.querySelectorAll(e) : _doc.getElementById(e.charAt(0) === "#" ? e.substr(1) : e);
	};

	var _lazyTweens = [],
	    _lazyLookup = {},
	    _numbersExp = /(?:(-|-=|\+=)?\d*\.?\d*(?:e[\-+]?\d+)?)[0-9]/ig,

	//_nonNumbersExp = /(?:([\-+](?!(\d|=)))|[^\d\-+=e]|(e(?![\-+][\d])))+/ig,
	_setRatio = function _setRatio(v) {
		var pt = this._firstPT,
		    min = 0.000001,
		    val;
		while (pt) {
			val = !pt.blob ? pt.c * v + pt.s : v === 1 ? this.end : v ? this.join("") : this.start;
			if (pt.m) {
				val = pt.m(val, this._target || pt.t);
			} else if (val < min) if (val > -min && !pt.blob) {
				//prevents issues with converting very small numbers to strings in the browser
				val = 0;
			}
			if (!pt.f) {
				pt.t[pt.p] = val;
			} else if (pt.fp) {
				pt.t[pt.p](pt.fp, val);
			} else {
				pt.t[pt.p](val);
			}
			pt = pt._next;
		}
	},

	//compares two strings (start/end), finds the numbers that are different and spits back an array representing the whole value but with the changing values isolated as elements. For example, "rgb(0,0,0)" and "rgb(100,50,0)" would become ["rgb(", 0, ",", 50, ",0)"]. Notice it merges the parts that are identical (performance optimization). The array also has a linked list of PropTweens attached starting with _firstPT that contain the tweening data (t, p, s, c, f, etc.). It also stores the starting value as a "start" property so that we can revert to it if/when necessary, like when a tween rewinds fully. If the quantity of numbers differs between the start and end, it will always prioritize the end value(s). The pt parameter is optional - it's for a PropTween that will be appended to the end of the linked list and is typically for actually setting the value after all of the elements have been updated (with array.join("")).
	_blobDif = function _blobDif(start, end, filter, pt) {
		var a = [],
		    charIndex = 0,
		    s = "",
		    color = 0,
		    startNums,
		    endNums,
		    num,
		    i,
		    l,
		    nonNumbers,
		    currentNum;
		a.start = start;
		a.end = end;
		start = a[0] = start + ""; //ensure values are strings
		end = a[1] = end + "";
		if (filter) {
			filter(a); //pass an array with the starting and ending values and let the filter do whatever it needs to the values.
			start = a[0];
			end = a[1];
		}
		a.length = 0;
		startNums = start.match(_numbersExp) || [];
		endNums = end.match(_numbersExp) || [];
		if (pt) {
			pt._next = null;
			pt.blob = 1;
			a._firstPT = a._applyPT = pt; //apply last in the linked list (which means inserting it first)
		}
		l = endNums.length;
		for (i = 0; i < l; i++) {
			currentNum = endNums[i];
			nonNumbers = end.substr(charIndex, end.indexOf(currentNum, charIndex) - charIndex);
			s += nonNumbers || !i ? nonNumbers : ","; //note: SVG spec allows omission of comma/space when a negative sign is wedged between two numbers, like 2.5-5.3 instead of 2.5,-5.3 but when tweening, the negative value may switch to positive, so we insert the comma just in case.
			charIndex += nonNumbers.length;
			if (color) {
				//sense rgba() values and round them.
				color = (color + 1) % 5;
			} else if (nonNumbers.substr(-5) === "rgba(") {
				color = 1;
			}
			if (currentNum === startNums[i] || startNums.length <= i) {
				s += currentNum;
			} else {
				if (s) {
					a.push(s);
					s = "";
				}
				num = parseFloat(startNums[i]);
				a.push(num);
				a._firstPT = { _next: a._firstPT, t: a, p: a.length - 1, s: num, c: (currentNum.charAt(1) === "=" ? parseInt(currentNum.charAt(0) + "1", 10) * parseFloat(currentNum.substr(2)) : parseFloat(currentNum) - num) || 0, f: 0, m: color && color < 4 ? Math.round : 0 };
				//note: we don't set _prev because we'll never need to remove individual PropTweens from this list.
			}
			charIndex += currentNum.length;
		}
		s += end.substr(charIndex);
		if (s) {
			a.push(s);
		}
		a.setRatio = _setRatio;
		return a;
	},

	//note: "funcParam" is only necessary for function-based getters/setters that require an extra parameter like getAttribute("width") and setAttribute("width", value). In this example, funcParam would be "width". Used by AttrPlugin for example.
	_addPropTween = function _addPropTween(target, prop, start, end, overwriteProp, mod, funcParam, stringFilter, index) {
		if (typeof end === "function") {
			end = end(index || 0, target);
		}
		var type = _typeof(target[prop]),
		    getterName = type !== "function" ? "" : prop.indexOf("set") || typeof target["get" + prop.substr(3)] !== "function" ? prop : "get" + prop.substr(3),
		    s = start !== "get" ? start : !getterName ? target[prop] : funcParam ? target[getterName](funcParam) : target[getterName](),
		    isRelative = typeof end === "string" && end.charAt(1) === "=",
		    pt = { t: target, p: prop, s: s, f: type === "function", pg: 0, n: overwriteProp || prop, m: !mod ? 0 : typeof mod === "function" ? mod : Math.round, pr: 0, c: isRelative ? parseInt(end.charAt(0) + "1", 10) * parseFloat(end.substr(2)) : parseFloat(end) - s || 0 },
		    blob;

		if (typeof s !== "number" || typeof end !== "number" && !isRelative) {
			if (funcParam || isNaN(s) || !isRelative && isNaN(end) || typeof s === "boolean" || typeof end === "boolean") {
				//a blob (string that has multiple numbers in it)
				pt.fp = funcParam;
				blob = _blobDif(s, isRelative ? pt.s + pt.c : end, stringFilter || TweenLite.defaultStringFilter, pt);
				pt = { t: blob, p: "setRatio", s: 0, c: 1, f: 2, pg: 0, n: overwriteProp || prop, pr: 0, m: 0 }; //"2" indicates it's a Blob property tween. Needed for RoundPropsPlugin for example.
			} else {
				pt.s = parseFloat(s);
				if (!isRelative) {
					pt.c = parseFloat(end) - pt.s || 0;
				}
			}
		}
		if (pt.c) {
			//only add it to the linked list if there's a change.
			if (pt._next = this._firstPT) {
				pt._next._prev = pt;
			}
			this._firstPT = pt;
			return pt;
		}
	},
	    _internals = TweenLite._internals = { isArray: _isArray, isSelector: _isSelector, lazyTweens: _lazyTweens, blobDif: _blobDif },
	    //gives us a way to expose certain private values to other GreenSock classes without contaminating tha main TweenLite object.
	_plugins = TweenLite._plugins = {},
	    _tweenLookup = _internals.tweenLookup = {},
	    _tweenLookupNum = 0,
	    _reservedProps = _internals.reservedProps = { ease: 1, delay: 1, overwrite: 1, onComplete: 1, onCompleteParams: 1, onCompleteScope: 1, useFrames: 1, runBackwards: 1, startAt: 1, onUpdate: 1, onUpdateParams: 1, onUpdateScope: 1, onStart: 1, onStartParams: 1, onStartScope: 1, onReverseComplete: 1, onReverseCompleteParams: 1, onReverseCompleteScope: 1, onRepeat: 1, onRepeatParams: 1, onRepeatScope: 1, easeParams: 1, yoyo: 1, immediateRender: 1, repeat: 1, repeatDelay: 1, data: 1, paused: 1, reversed: 1, autoCSS: 1, lazy: 1, onOverwrite: 1, callbackScope: 1, stringFilter: 1, id: 1 },
	    _overwriteLookup = { none: 0, all: 1, auto: 2, concurrent: 3, allOnStart: 4, preexisting: 5, "true": 1, "false": 0 },
	    _rootFramesTimeline = Animation._rootFramesTimeline = new SimpleTimeline(),
	    _rootTimeline = Animation._rootTimeline = new SimpleTimeline(),
	    _nextGCFrame = 30,
	    _lazyRender = _internals.lazyRender = function () {
		var i = _lazyTweens.length,
		    tween;
		_lazyLookup = {};
		while (--i > -1) {
			tween = _lazyTweens[i];
			if (tween && tween._lazy !== false) {
				tween.render(tween._lazy[0], tween._lazy[1], true);
				tween._lazy = false;
			}
		}
		_lazyTweens.length = 0;
	};

	_rootTimeline._startTime = _ticker.time;
	_rootFramesTimeline._startTime = _ticker.frame;
	_rootTimeline._active = _rootFramesTimeline._active = true;
	setTimeout(_lazyRender, 1); //on some mobile devices, there isn't a "tick" before code runs which means any lazy renders wouldn't run before the next official "tick".

	Animation._updateRoot = TweenLite.render = function () {
		var i, a, p;
		if (_lazyTweens.length) {
			//if code is run outside of the requestAnimationFrame loop, there may be tweens queued AFTER the engine refreshed, so we need to ensure any pending renders occur before we refresh again.
			_lazyRender();
		}
		_rootTimeline.render((_ticker.time - _rootTimeline._startTime) * _rootTimeline._timeScale, false, false);
		_rootFramesTimeline.render((_ticker.frame - _rootFramesTimeline._startTime) * _rootFramesTimeline._timeScale, false, false);
		if (_lazyTweens.length) {
			_lazyRender();
		}
		if (_ticker.frame >= _nextGCFrame) {
			//dump garbage every 120 frames or whatever the user sets TweenLite.autoSleep to
			_nextGCFrame = _ticker.frame + (parseInt(TweenLite.autoSleep, 10) || 120);
			for (p in _tweenLookup) {
				a = _tweenLookup[p].tweens;
				i = a.length;
				while (--i > -1) {
					if (a[i]._gc) {
						a.splice(i, 1);
					}
				}
				if (a.length === 0) {
					delete _tweenLookup[p];
				}
			}
			//if there are no more tweens in the root timelines, or if they're all paused, make the _timer sleep to reduce load on the CPU slightly
			p = _rootTimeline._first;
			if (!p || p._paused) if (TweenLite.autoSleep && !_rootFramesTimeline._first && _ticker._listeners.tick.length === 1) {
				while (p && p._paused) {
					p = p._next;
				}
				if (!p) {
					_ticker.sleep();
				}
			}
		}
	};

	_ticker.addEventListener("tick", Animation._updateRoot);

	var _register = function _register(target, tween, scrub) {
		var id = target._gsTweenID,
		    a,
		    i;
		if (!_tweenLookup[id || (target._gsTweenID = id = "t" + _tweenLookupNum++)]) {
			_tweenLookup[id] = { target: target, tweens: [] };
		}
		if (tween) {
			a = _tweenLookup[id].tweens;
			a[i = a.length] = tween;
			if (scrub) {
				while (--i > -1) {
					if (a[i] === tween) {
						a.splice(i, 1);
					}
				}
			}
		}
		return _tweenLookup[id].tweens;
	},
	    _onOverwrite = function _onOverwrite(overwrittenTween, overwritingTween, target, killedProps) {
		var func = overwrittenTween.vars.onOverwrite,
		    r1,
		    r2;
		if (func) {
			r1 = func(overwrittenTween, overwritingTween, target, killedProps);
		}
		func = TweenLite.onOverwrite;
		if (func) {
			r2 = func(overwrittenTween, overwritingTween, target, killedProps);
		}
		return r1 !== false && r2 !== false;
	},
	    _applyOverwrite = function _applyOverwrite(target, tween, props, mode, siblings) {
		var i, changed, curTween, l;
		if (mode === 1 || mode >= 4) {
			l = siblings.length;
			for (i = 0; i < l; i++) {
				if ((curTween = siblings[i]) !== tween) {
					if (!curTween._gc) {
						if (curTween._kill(null, target, tween)) {
							changed = true;
						}
					}
				} else if (mode === 5) {
					break;
				}
			}
			return changed;
		}
		//NOTE: Add 0.0000000001 to overcome floating point errors that can cause the startTime to be VERY slightly off (when a tween's time() is set for example)
		var startTime = tween._startTime + _tinyNum,
		    overlaps = [],
		    oCount = 0,
		    zeroDur = tween._duration === 0,
		    globalStart;
		i = siblings.length;
		while (--i > -1) {
			if ((curTween = siblings[i]) === tween || curTween._gc || curTween._paused) {
				//ignore
			} else if (curTween._timeline !== tween._timeline) {
				globalStart = globalStart || _checkOverlap(tween, 0, zeroDur);
				if (_checkOverlap(curTween, globalStart, zeroDur) === 0) {
					overlaps[oCount++] = curTween;
				}
			} else if (curTween._startTime <= startTime) if (curTween._startTime + curTween.totalDuration() / curTween._timeScale > startTime) if (!((zeroDur || !curTween._initted) && startTime - curTween._startTime <= 0.0000000002)) {
				overlaps[oCount++] = curTween;
			}
		}

		i = oCount;
		while (--i > -1) {
			curTween = overlaps[i];
			if (mode === 2) if (curTween._kill(props, target, tween)) {
				changed = true;
			}
			if (mode !== 2 || !curTween._firstPT && curTween._initted) {
				if (mode !== 2 && !_onOverwrite(curTween, tween)) {
					continue;
				}
				if (curTween._enabled(false, false)) {
					//if all property tweens have been overwritten, kill the tween.
					changed = true;
				}
			}
		}
		return changed;
	},
	    _checkOverlap = function _checkOverlap(tween, reference, zeroDur) {
		var tl = tween._timeline,
		    ts = tl._timeScale,
		    t = tween._startTime;
		while (tl._timeline) {
			t += tl._startTime;
			ts *= tl._timeScale;
			if (tl._paused) {
				return -100;
			}
			tl = tl._timeline;
		}
		t /= ts;
		return t > reference ? t - reference : zeroDur && t === reference || !tween._initted && t - reference < 2 * _tinyNum ? _tinyNum : (t += tween.totalDuration() / tween._timeScale / ts) > reference + _tinyNum ? 0 : t - reference - _tinyNum;
	};

	//---- TweenLite instance methods -----------------------------------------------------------------------------

	p._init = function () {
		var v = this.vars,
		    op = this._overwrittenProps,
		    dur = this._duration,
		    immediate = !!v.immediateRender,
		    ease = v.ease,
		    i,
		    initPlugins,
		    pt,
		    p,
		    startVars,
		    l;
		if (v.startAt) {
			if (this._startAt) {
				this._startAt.render(-1, true); //if we've run a startAt previously (when the tween instantiated), we should revert it so that the values re-instantiate correctly particularly for relative tweens. Without this, a TweenLite.fromTo(obj, 1, {x:"+=100"}, {x:"-=100"}), for example, would actually jump to +=200 because the startAt would run twice, doubling the relative change.
				this._startAt.kill();
			}
			startVars = {};
			for (p in v.startAt) {
				//copy the properties/values into a new object to avoid collisions, like var to = {x:0}, from = {x:500}; timeline.fromTo(e, 1, from, to).fromTo(e, 1, to, from);
				startVars[p] = v.startAt[p];
			}
			startVars.overwrite = false;
			startVars.immediateRender = true;
			startVars.lazy = immediate && v.lazy !== false;
			startVars.startAt = startVars.delay = null; //no nesting of startAt objects allowed (otherwise it could cause an infinite loop).
			this._startAt = TweenLite.to(this.target, 0, startVars);
			if (immediate) {
				if (this._time > 0) {
					this._startAt = null; //tweens that render immediately (like most from() and fromTo() tweens) shouldn't revert when their parent timeline's playhead goes backward past the startTime because the initial render could have happened anytime and it shouldn't be directly correlated to this tween's startTime. Imagine setting up a complex animation where the beginning states of various objects are rendered immediately but the tween doesn't happen for quite some time - if we revert to the starting values as soon as the playhead goes backward past the tween's startTime, it will throw things off visually. Reversion should only happen in TimelineLite/Max instances where immediateRender was false (which is the default in the convenience methods like from()).
				} else if (dur !== 0) {
					return; //we skip initialization here so that overwriting doesn't occur until the tween actually begins. Otherwise, if you create several immediateRender:true tweens of the same target/properties to drop into a TimelineLite or TimelineMax, the last one created would overwrite the first ones because they didn't get placed into the timeline yet before the first render occurs and kicks in overwriting.
				}
			}
		} else if (v.runBackwards && dur !== 0) {
			//from() tweens must be handled uniquely: their beginning values must be rendered but we don't want overwriting to occur yet (when time is still 0). Wait until the tween actually begins before doing all the routines like overwriting. At that time, we should render at the END of the tween to ensure that things initialize correctly (remember, from() tweens go backwards)
			if (this._startAt) {
				this._startAt.render(-1, true);
				this._startAt.kill();
				this._startAt = null;
			} else {
				if (this._time !== 0) {
					//in rare cases (like if a from() tween runs and then is invalidate()-ed), immediateRender could be true but the initial forced-render gets skipped, so there's no need to force the render in this context when the _time is greater than 0
					immediate = false;
				}
				pt = {};
				for (p in v) {
					//copy props into a new object and skip any reserved props, otherwise onComplete or onUpdate or onStart could fire. We should, however, permit autoCSS to go through.
					if (!_reservedProps[p] || p === "autoCSS") {
						pt[p] = v[p];
					}
				}
				pt.overwrite = 0;
				pt.data = "isFromStart"; //we tag the tween with as "isFromStart" so that if [inside a plugin] we need to only do something at the very END of a tween, we have a way of identifying this tween as merely the one that's setting the beginning values for a "from()" tween. For example, clearProps in CSSPlugin should only get applied at the very END of a tween and without this tag, from(...{height:100, clearProps:"height", delay:1}) would wipe the height at the beginning of the tween and after 1 second, it'd kick back in.
				pt.lazy = immediate && v.lazy !== false;
				pt.immediateRender = immediate; //zero-duration tweens render immediately by default, but if we're not specifically instructed to render this tween immediately, we should skip this and merely _init() to record the starting values (rendering them immediately would push them to completion which is wasteful in that case - we'd have to render(-1) immediately after)
				this._startAt = TweenLite.to(this.target, 0, pt);
				if (!immediate) {
					this._startAt._init(); //ensures that the initial values are recorded
					this._startAt._enabled(false); //no need to have the tween render on the next cycle. Disable it because we'll always manually control the renders of the _startAt tween.
					if (this.vars.immediateRender) {
						this._startAt = null;
					}
				} else if (this._time === 0) {
					return;
				}
			}
		}
		this._ease = ease = !ease ? TweenLite.defaultEase : ease instanceof Ease ? ease : typeof ease === "function" ? new Ease(ease, v.easeParams) : _easeMap[ease] || TweenLite.defaultEase;
		if (v.easeParams instanceof Array && ease.config) {
			this._ease = ease.config.apply(ease, v.easeParams);
		}
		this._easeType = this._ease._type;
		this._easePower = this._ease._power;
		this._firstPT = null;

		if (this._targets) {
			l = this._targets.length;
			for (i = 0; i < l; i++) {
				if (this._initProps(this._targets[i], this._propLookup[i] = {}, this._siblings[i], op ? op[i] : null, i)) {
					initPlugins = true;
				}
			}
		} else {
			initPlugins = this._initProps(this.target, this._propLookup, this._siblings, op, 0);
		}

		if (initPlugins) {
			TweenLite._onPluginEvent("_onInitAllProps", this); //reorders the array in order of priority. Uses a static TweenPlugin method in order to minimize file size in TweenLite
		}
		if (op) if (!this._firstPT) if (typeof this.target !== "function") {
			//if all tweening properties have been overwritten, kill the tween. If the target is a function, it's probably a delayedCall so let it live.
			this._enabled(false, false);
		}
		if (v.runBackwards) {
			pt = this._firstPT;
			while (pt) {
				pt.s += pt.c;
				pt.c = -pt.c;
				pt = pt._next;
			}
		}
		this._onUpdate = v.onUpdate;
		this._initted = true;
	};

	p._initProps = function (target, propLookup, siblings, overwrittenProps, index) {
		var p, i, initPlugins, plugin, pt, v;
		if (target == null) {
			return false;
		}

		if (_lazyLookup[target._gsTweenID]) {
			_lazyRender(); //if other tweens of the same target have recently initted but haven't rendered yet, we've got to force the render so that the starting values are correct (imagine populating a timeline with a bunch of sequential tweens and then jumping to the end)
		}

		if (!this.vars.css) if (target.style) if (target !== window && target.nodeType) if (_plugins.css) if (this.vars.autoCSS !== false) {
			//it's so common to use TweenLite/Max to animate the css of DOM elements, we assume that if the target is a DOM element, that's what is intended (a convenience so that users don't have to wrap things in css:{}, although we still recommend it for a slight performance boost and better specificity). Note: we cannot check "nodeType" on the window inside an iframe.
			_autoCSS(this.vars, target);
		}
		for (p in this.vars) {
			v = this.vars[p];
			if (_reservedProps[p]) {
				if (v) if (v instanceof Array || v.push && _isArray(v)) if (v.join("").indexOf("{self}") !== -1) {
					this.vars[p] = v = this._swapSelfInParams(v, this);
				}
			} else if (_plugins[p] && (plugin = new _plugins[p]())._onInitTween(target, this.vars[p], this, index)) {

				//t - target 		[object]
				//p - property 		[string]
				//s - start			[number]
				//c - change		[number]
				//f - isFunction	[boolean]
				//n - name			[string]
				//pg - isPlugin 	[boolean]
				//pr - priority		[number]
				//m - mod           [function | 0]
				this._firstPT = pt = { _next: this._firstPT, t: plugin, p: "setRatio", s: 0, c: 1, f: 1, n: p, pg: 1, pr: plugin._priority, m: 0 };
				i = plugin._overwriteProps.length;
				while (--i > -1) {
					propLookup[plugin._overwriteProps[i]] = this._firstPT;
				}
				if (plugin._priority || plugin._onInitAllProps) {
					initPlugins = true;
				}
				if (plugin._onDisable || plugin._onEnable) {
					this._notifyPluginsOfEnabled = true;
				}
				if (pt._next) {
					pt._next._prev = pt;
				}
			} else {
				propLookup[p] = _addPropTween.call(this, target, p, "get", v, p, 0, null, this.vars.stringFilter, index);
			}
		}

		if (overwrittenProps) if (this._kill(overwrittenProps, target)) {
			//another tween may have tried to overwrite properties of this tween before init() was called (like if two tweens start at the same time, the one created second will run first)
			return this._initProps(target, propLookup, siblings, overwrittenProps, index);
		}
		if (this._overwrite > 1) if (this._firstPT) if (siblings.length > 1) if (_applyOverwrite(target, this, propLookup, this._overwrite, siblings)) {
			this._kill(propLookup, target);
			return this._initProps(target, propLookup, siblings, overwrittenProps, index);
		}
		if (this._firstPT) if (this.vars.lazy !== false && this._duration || this.vars.lazy && !this._duration) {
			//zero duration tweens don't lazy render by default; everything else does.
			_lazyLookup[target._gsTweenID] = true;
		}
		return initPlugins;
	};

	p.render = function (time, suppressEvents, force) {
		var prevTime = this._time,
		    duration = this._duration,
		    prevRawPrevTime = this._rawPrevTime,
		    isComplete,
		    callback,
		    pt,
		    rawPrevTime;
		if (time >= duration - 0.0000001 && time >= 0) {
			//to work around occasional floating point math artifacts.
			this._totalTime = this._time = duration;
			this.ratio = this._ease._calcEnd ? this._ease.getRatio(1) : 1;
			if (!this._reversed) {
				isComplete = true;
				callback = "onComplete";
				force = force || this._timeline.autoRemoveChildren; //otherwise, if the animation is unpaused/activated after it's already finished, it doesn't get removed from the parent timeline.
			}
			if (duration === 0) if (this._initted || !this.vars.lazy || force) {
				//zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
				if (this._startTime === this._timeline._duration) {
					//if a zero-duration tween is at the VERY end of a timeline and that timeline renders at its end, it will typically add a tiny bit of cushion to the render time to prevent rounding errors from getting in the way of tweens rendering their VERY end. If we then reverse() that timeline, the zero-duration tween will trigger its onReverseComplete even though technically the playhead didn't pass over it again. It's a very specific edge case we must accommodate.
					time = 0;
				}
				if (prevRawPrevTime < 0 || time <= 0 && time >= -0.0000001 || prevRawPrevTime === _tinyNum && this.data !== "isPause") if (prevRawPrevTime !== time) {
					//note: when this.data is "isPause", it's a callback added by addPause() on a timeline that we should not be triggered when LEAVING its exact start time. In other words, tl.addPause(1).play(1) shouldn't pause.
					force = true;
					if (prevRawPrevTime > _tinyNum) {
						callback = "onReverseComplete";
					}
				}
				this._rawPrevTime = rawPrevTime = !suppressEvents || time || prevRawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
			}
		} else if (time < 0.0000001) {
			//to work around occasional floating point math artifacts, round super small values to 0.
			this._totalTime = this._time = 0;
			this.ratio = this._ease._calcEnd ? this._ease.getRatio(0) : 0;
			if (prevTime !== 0 || duration === 0 && prevRawPrevTime > 0) {
				callback = "onReverseComplete";
				isComplete = this._reversed;
			}
			if (time < 0) {
				this._active = false;
				if (duration === 0) if (this._initted || !this.vars.lazy || force) {
					//zero-duration tweens are tricky because we must discern the momentum/direction of time in order to determine whether the starting values should be rendered or the ending values. If the "playhead" of its timeline goes past the zero-duration tween in the forward direction or lands directly on it, the end values should be rendered, but if the timeline's "playhead" moves past it in the backward direction (from a postitive time to a negative time), the starting values must be rendered.
					if (prevRawPrevTime >= 0 && !(prevRawPrevTime === _tinyNum && this.data === "isPause")) {
						force = true;
					}
					this._rawPrevTime = rawPrevTime = !suppressEvents || time || prevRawPrevTime === time ? time : _tinyNum; //when the playhead arrives at EXACTLY time 0 (right on top) of a zero-duration tween, we need to discern if events are suppressed so that when the playhead moves again (next time), it'll trigger the callback. If events are NOT suppressed, obviously the callback would be triggered in this render. Basically, the callback should fire either when the playhead ARRIVES or LEAVES this exact spot, not both. Imagine doing a timeline.seek(0) and there's a callback that sits at 0. Since events are suppressed on that seek() by default, nothing will fire, but when the playhead moves off of that position, the callback should fire. This behavior is what people intuitively expect. We set the _rawPrevTime to be a precise tiny number to indicate this scenario rather than using another property/variable which would increase memory usage. This technique is less readable, but more efficient.
				}
			}
			if (!this._initted) {
				//if we render the very beginning (time == 0) of a fromTo(), we must force the render (normal tweens wouldn't need to render at a time of 0 when the prevTime was also 0). This is also mandatory to make sure overwriting kicks in immediately.
				force = true;
			}
		} else {
			this._totalTime = this._time = time;

			if (this._easeType) {
				var r = time / duration,
				    type = this._easeType,
				    pow = this._easePower;
				if (type === 1 || type === 3 && r >= 0.5) {
					r = 1 - r;
				}
				if (type === 3) {
					r *= 2;
				}
				if (pow === 1) {
					r *= r;
				} else if (pow === 2) {
					r *= r * r;
				} else if (pow === 3) {
					r *= r * r * r;
				} else if (pow === 4) {
					r *= r * r * r * r;
				}

				if (type === 1) {
					this.ratio = 1 - r;
				} else if (type === 2) {
					this.ratio = r;
				} else if (time / duration < 0.5) {
					this.ratio = r / 2;
				} else {
					this.ratio = 1 - r / 2;
				}
			} else {
				this.ratio = this._ease.getRatio(time / duration);
			}
		}

		if (this._time === prevTime && !force) {
			return;
		} else if (!this._initted) {
			this._init();
			if (!this._initted || this._gc) {
				//immediateRender tweens typically won't initialize until the playhead advances (_time is greater than 0) in order to ensure that overwriting occurs properly. Also, if all of the tweening properties have been overwritten (which would cause _gc to be true, as set in _init()), we shouldn't continue otherwise an onStart callback could be called for example.
				return;
			} else if (!force && this._firstPT && (this.vars.lazy !== false && this._duration || this.vars.lazy && !this._duration)) {
				this._time = this._totalTime = prevTime;
				this._rawPrevTime = prevRawPrevTime;
				_lazyTweens.push(this);
				this._lazy = [time, suppressEvents];
				return;
			}
			//_ease is initially set to defaultEase, so now that init() has run, _ease is set properly and we need to recalculate the ratio. Overall this is faster than using conditional logic earlier in the method to avoid having to set ratio twice because we only init() once but renderTime() gets called VERY frequently.
			if (this._time && !isComplete) {
				this.ratio = this._ease.getRatio(this._time / duration);
			} else if (isComplete && this._ease._calcEnd) {
				this.ratio = this._ease.getRatio(this._time === 0 ? 0 : 1);
			}
		}
		if (this._lazy !== false) {
			//in case a lazy render is pending, we should flush it because the new render is occurring now (imagine a lazy tween instantiating and then immediately the user calls tween.seek(tween.duration()), skipping to the end - the end render would be forced, and then if we didn't flush the lazy render, it'd fire AFTER the seek(), rendering it at the wrong time.
			this._lazy = false;
		}
		if (!this._active) if (!this._paused && this._time !== prevTime && time >= 0) {
			this._active = true; //so that if the user renders a tween (as opposed to the timeline rendering it), the timeline is forced to re-render and align it with the proper time/frame on the next rendering cycle. Maybe the tween already finished but the user manually re-renders it as halfway done.
		}
		if (prevTime === 0) {
			if (this._startAt) {
				if (time >= 0) {
					this._startAt.render(time, suppressEvents, force);
				} else if (!callback) {
					callback = "_dummyGS"; //if no callback is defined, use a dummy value just so that the condition at the end evaluates as true because _startAt should render AFTER the normal render loop when the time is negative. We could handle this in a more intuitive way, of course, but the render loop is the MOST important thing to optimize, so this technique allows us to avoid adding extra conditional logic in a high-frequency area.
				}
			}
			if (this.vars.onStart) if (this._time !== 0 || duration === 0) if (!suppressEvents) {
				this._callback("onStart");
			}
		}
		pt = this._firstPT;
		while (pt) {
			if (pt.f) {
				pt.t[pt.p](pt.c * this.ratio + pt.s);
			} else {
				pt.t[pt.p] = pt.c * this.ratio + pt.s;
			}
			pt = pt._next;
		}

		if (this._onUpdate) {
			if (time < 0) if (this._startAt && time !== -0.0001) {
				//if the tween is positioned at the VERY beginning (_startTime 0) of its parent timeline, it's illegal for the playhead to go back further, so we should not render the recorded startAt values.
				this._startAt.render(time, suppressEvents, force); //note: for performance reasons, we tuck this conditional logic inside less traveled areas (most tweens don't have an onUpdate). We'd just have it at the end before the onComplete, but the values should be updated before any onUpdate is called, so we ALSO put it here and then if it's not called, we do so later near the onComplete.
			}
			if (!suppressEvents) if (this._time !== prevTime || isComplete || force) {
				this._callback("onUpdate");
			}
		}
		if (callback) if (!this._gc || force) {
			//check _gc because there's a chance that kill() could be called in an onUpdate
			if (time < 0 && this._startAt && !this._onUpdate && time !== -0.0001) {
				//-0.0001 is a special value that we use when looping back to the beginning of a repeated TimelineMax, in which case we shouldn't render the _startAt values.
				this._startAt.render(time, suppressEvents, force);
			}
			if (isComplete) {
				if (this._timeline.autoRemoveChildren) {
					this._enabled(false, false);
				}
				this._active = false;
			}
			if (!suppressEvents && this.vars[callback]) {
				this._callback(callback);
			}
			if (duration === 0 && this._rawPrevTime === _tinyNum && rawPrevTime !== _tinyNum) {
				//the onComplete or onReverseComplete could trigger movement of the playhead and for zero-duration tweens (which must discern direction) that land directly back on their start time, we don't want to fire again on the next render. Think of several addPause()'s in a timeline that forces the playhead to a certain spot, but what if it's already paused and another tween is tweening the "time" of the timeline? Each time it moves [forward] past that spot, it would move back, and since suppressEvents is true, it'd reset _rawPrevTime to _tinyNum so that when it begins again, the callback would fire (so ultimately it could bounce back and forth during that tween). Again, this is a very uncommon scenario, but possible nonetheless.
				this._rawPrevTime = 0;
			}
		}
	};

	p._kill = function (vars, target, overwritingTween) {
		if (vars === "all") {
			vars = null;
		}
		if (vars == null) if (target == null || target === this.target) {
			this._lazy = false;
			return this._enabled(false, false);
		}
		target = typeof target !== "string" ? target || this._targets || this.target : TweenLite.selector(target) || target;
		var simultaneousOverwrite = overwritingTween && this._time && overwritingTween._startTime === this._startTime && this._timeline === overwritingTween._timeline,
		    i,
		    overwrittenProps,
		    p,
		    pt,
		    propLookup,
		    changed,
		    killProps,
		    record,
		    killed;
		if ((_isArray(target) || _isSelector(target)) && typeof target[0] !== "number") {
			i = target.length;
			while (--i > -1) {
				if (this._kill(vars, target[i], overwritingTween)) {
					changed = true;
				}
			}
		} else {
			if (this._targets) {
				i = this._targets.length;
				while (--i > -1) {
					if (target === this._targets[i]) {
						propLookup = this._propLookup[i] || {};
						this._overwrittenProps = this._overwrittenProps || [];
						overwrittenProps = this._overwrittenProps[i] = vars ? this._overwrittenProps[i] || {} : "all";
						break;
					}
				}
			} else if (target !== this.target) {
				return false;
			} else {
				propLookup = this._propLookup;
				overwrittenProps = this._overwrittenProps = vars ? this._overwrittenProps || {} : "all";
			}

			if (propLookup) {
				killProps = vars || propLookup;
				record = vars !== overwrittenProps && overwrittenProps !== "all" && vars !== propLookup && ((typeof vars === "undefined" ? "undefined" : _typeof(vars)) !== "object" || !vars._tempKill); //_tempKill is a super-secret way to delete a particular tweening property but NOT have it remembered as an official overwritten property (like in BezierPlugin)
				if (overwritingTween && (TweenLite.onOverwrite || this.vars.onOverwrite)) {
					for (p in killProps) {
						if (propLookup[p]) {
							if (!killed) {
								killed = [];
							}
							killed.push(p);
						}
					}
					if ((killed || !vars) && !_onOverwrite(this, overwritingTween, target, killed)) {
						//if the onOverwrite returned false, that means the user wants to override the overwriting (cancel it).
						return false;
					}
				}

				for (p in killProps) {
					if (pt = propLookup[p]) {
						if (simultaneousOverwrite) {
							//if another tween overwrites this one and they both start at exactly the same time, yet this tween has already rendered once (for example, at 0.001) because it's first in the queue, we should revert the values to where they were at 0 so that the starting values aren't contaminated on the overwriting tween.
							if (pt.f) {
								pt.t[pt.p](pt.s);
							} else {
								pt.t[pt.p] = pt.s;
							}
							changed = true;
						}
						if (pt.pg && pt.t._kill(killProps)) {
							changed = true; //some plugins need to be notified so they can perform cleanup tasks first
						}
						if (!pt.pg || pt.t._overwriteProps.length === 0) {
							if (pt._prev) {
								pt._prev._next = pt._next;
							} else if (pt === this._firstPT) {
								this._firstPT = pt._next;
							}
							if (pt._next) {
								pt._next._prev = pt._prev;
							}
							pt._next = pt._prev = null;
						}
						delete propLookup[p];
					}
					if (record) {
						overwrittenProps[p] = 1;
					}
				}
				if (!this._firstPT && this._initted) {
					//if all tweening properties are killed, kill the tween. Without this line, if there's a tween with multiple targets and then you killTweensOf() each target individually, the tween would technically still remain active and fire its onComplete even though there aren't any more properties tweening.
					this._enabled(false, false);
				}
			}
		}
		return changed;
	};

	p.invalidate = function () {
		if (this._notifyPluginsOfEnabled) {
			TweenLite._onPluginEvent("_onDisable", this);
		}
		this._firstPT = this._overwrittenProps = this._startAt = this._onUpdate = null;
		this._notifyPluginsOfEnabled = this._active = this._lazy = false;
		this._propLookup = this._targets ? {} : [];
		Animation.prototype.invalidate.call(this);
		if (this.vars.immediateRender) {
			this._time = -_tinyNum; //forces a render without having to set the render() "force" parameter to true because we want to allow lazying by default (using the "force" parameter always forces an immediate full render)
			this.render(Math.min(0, -this._delay)); //in case delay is negative.
		}
		return this;
	};

	p._enabled = function (enabled, ignoreTimeline) {
		if (!_tickerActive) {
			_ticker.wake();
		}
		if (enabled && this._gc) {
			var targets = this._targets,
			    i;
			if (targets) {
				i = targets.length;
				while (--i > -1) {
					this._siblings[i] = _register(targets[i], this, true);
				}
			} else {
				this._siblings = _register(this.target, this, true);
			}
		}
		Animation.prototype._enabled.call(this, enabled, ignoreTimeline);
		if (this._notifyPluginsOfEnabled) if (this._firstPT) {
			return TweenLite._onPluginEvent(enabled ? "_onEnable" : "_onDisable", this);
		}
		return false;
	};

	//----TweenLite static methods -----------------------------------------------------

	TweenLite.to = function (target, duration, vars) {
		return new TweenLite(target, duration, vars);
	};

	TweenLite.from = function (target, duration, vars) {
		vars.runBackwards = true;
		vars.immediateRender = vars.immediateRender != false;
		return new TweenLite(target, duration, vars);
	};

	TweenLite.fromTo = function (target, duration, fromVars, toVars) {
		toVars.startAt = fromVars;
		toVars.immediateRender = toVars.immediateRender != false && fromVars.immediateRender != false;
		return new TweenLite(target, duration, toVars);
	};

	TweenLite.delayedCall = function (delay, callback, params, scope, useFrames) {
		return new TweenLite(callback, 0, { delay: delay, onComplete: callback, onCompleteParams: params, callbackScope: scope, onReverseComplete: callback, onReverseCompleteParams: params, immediateRender: false, lazy: false, useFrames: useFrames, overwrite: 0 });
	};

	TweenLite.set = function (target, vars) {
		return new TweenLite(target, 0, vars);
	};

	TweenLite.getTweensOf = function (target, onlyActive) {
		if (target == null) {
			return [];
		}
		target = typeof target !== "string" ? target : TweenLite.selector(target) || target;
		var i, a, j, t;
		if ((_isArray(target) || _isSelector(target)) && typeof target[0] !== "number") {
			i = target.length;
			a = [];
			while (--i > -1) {
				a = a.concat(TweenLite.getTweensOf(target[i], onlyActive));
			}
			i = a.length;
			//now get rid of any duplicates (tweens of arrays of objects could cause duplicates)
			while (--i > -1) {
				t = a[i];
				j = i;
				while (--j > -1) {
					if (t === a[j]) {
						a.splice(i, 1);
					}
				}
			}
		} else {
			a = _register(target).concat();
			i = a.length;
			while (--i > -1) {
				if (a[i]._gc || onlyActive && !a[i].isActive()) {
					a.splice(i, 1);
				}
			}
		}
		return a;
	};

	TweenLite.killTweensOf = TweenLite.killDelayedCallsTo = function (target, onlyActive, vars) {
		if ((typeof onlyActive === "undefined" ? "undefined" : _typeof(onlyActive)) === "object") {
			vars = onlyActive; //for backwards compatibility (before "onlyActive" parameter was inserted)
			onlyActive = false;
		}
		var a = TweenLite.getTweensOf(target, onlyActive),
		    i = a.length;
		while (--i > -1) {
			a[i]._kill(vars, target);
		}
	};

	/*
  * ----------------------------------------------------------------
  * TweenPlugin   (could easily be split out as a separate file/class, but included for ease of use (so that people don't need to include another script call before loading plugins which is easy to forget)
  * ----------------------------------------------------------------
  */
	var TweenPlugin = _class("plugins.TweenPlugin", function (props, priority) {
		this._overwriteProps = (props || "").split(",");
		this._propName = this._overwriteProps[0];
		this._priority = priority || 0;
		this._super = TweenPlugin.prototype;
	}, true);

	p = TweenPlugin.prototype;
	TweenPlugin.version = "1.19.0";
	TweenPlugin.API = 2;
	p._firstPT = null;
	p._addTween = _addPropTween;
	p.setRatio = _setRatio;

	p._kill = function (lookup) {
		var a = this._overwriteProps,
		    pt = this._firstPT,
		    i;
		if (lookup[this._propName] != null) {
			this._overwriteProps = [];
		} else {
			i = a.length;
			while (--i > -1) {
				if (lookup[a[i]] != null) {
					a.splice(i, 1);
				}
			}
		}
		while (pt) {
			if (lookup[pt.n] != null) {
				if (pt._next) {
					pt._next._prev = pt._prev;
				}
				if (pt._prev) {
					pt._prev._next = pt._next;
					pt._prev = null;
				} else if (this._firstPT === pt) {
					this._firstPT = pt._next;
				}
			}
			pt = pt._next;
		}
		return false;
	};

	p._mod = p._roundProps = function (lookup) {
		var pt = this._firstPT,
		    val;
		while (pt) {
			val = lookup[this._propName] || pt.n != null && lookup[pt.n.split(this._propName + "_").join("")];
			if (val && typeof val === "function") {
				//some properties that are very plugin-specific add a prefix named after the _propName plus an underscore, so we need to ignore that extra stuff here.
				if (pt.f === 2) {
					pt.t._applyPT.m = val;
				} else {
					pt.m = val;
				}
			}
			pt = pt._next;
		}
	};

	TweenLite._onPluginEvent = function (type, tween) {
		var pt = tween._firstPT,
		    changed,
		    pt2,
		    first,
		    last,
		    next;
		if (type === "_onInitAllProps") {
			//sorts the PropTween linked list in order of priority because some plugins need to render earlier/later than others, like MotionBlurPlugin applies its effects after all x/y/alpha tweens have rendered on each frame.
			while (pt) {
				next = pt._next;
				pt2 = first;
				while (pt2 && pt2.pr > pt.pr) {
					pt2 = pt2._next;
				}
				if (pt._prev = pt2 ? pt2._prev : last) {
					pt._prev._next = pt;
				} else {
					first = pt;
				}
				if (pt._next = pt2) {
					pt2._prev = pt;
				} else {
					last = pt;
				}
				pt = next;
			}
			pt = tween._firstPT = first;
		}
		while (pt) {
			if (pt.pg) if (typeof pt.t[type] === "function") if (pt.t[type]()) {
				changed = true;
			}
			pt = pt._next;
		}
		return changed;
	};

	TweenPlugin.activate = function (plugins) {
		var i = plugins.length;
		while (--i > -1) {
			if (plugins[i].API === TweenPlugin.API) {
				_plugins[new plugins[i]()._propName] = plugins[i];
			}
		}
		return true;
	};

	//provides a more concise way to define plugins that have no dependencies besides TweenPlugin and TweenLite, wrapping common boilerplate stuff into one function (added in 1.9.0). You don't NEED to use this to define a plugin - the old way still works and can be useful in certain (rare) situations.
	_gsDefine.plugin = function (config) {
		if (!config || !config.propName || !config.init || !config.API) {
			throw "illegal plugin definition.";
		}
		var propName = config.propName,
		    priority = config.priority || 0,
		    overwriteProps = config.overwriteProps,
		    map = { init: "_onInitTween", set: "setRatio", kill: "_kill", round: "_mod", mod: "_mod", initAll: "_onInitAllProps" },
		    Plugin = _class("plugins." + propName.charAt(0).toUpperCase() + propName.substr(1) + "Plugin", function () {
			TweenPlugin.call(this, propName, priority);
			this._overwriteProps = overwriteProps || [];
		}, config.global === true),
		    p = Plugin.prototype = new TweenPlugin(propName),
		    prop;
		p.constructor = Plugin;
		Plugin.API = config.API;
		for (prop in map) {
			if (typeof config[prop] === "function") {
				p[map[prop]] = config[prop];
			}
		}
		Plugin.version = config.version;
		TweenPlugin.activate([Plugin]);
		return Plugin;
	};

	//now run through all the dependencies discovered and if any are missing, log that to the console as a warning. This is why it's best to have TweenLite load last - it can check all the dependencies for you.
	a = window._gsQueue;
	if (a) {
		for (i = 0; i < a.length; i++) {
			a[i]();
		}
		for (p in _defLookup) {
			if (!_defLookup[p].func) {
				window.console.log("GSAP encountered missing dependency: " + p);
			}
		}
	}

	_tickerActive = false; //ensures that the first official animation forces a ticker.tick() to update the time when it is instantiated
})(typeof module !== "undefined" && module.exports && typeof global !== "undefined" ? global : undefined || window, "TweenLite");

cc._RF.pop();
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{}],"attrview":[function(require,module,exports){
"use strict";
cc._RF.push(module, '67a36DBUtVDI6gBg+uAiy/+', 'attrview');
// Script/town/attrview.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        attrview: cc.Node,
        prefabSelectview: cc.Prefab,
        prefabEquip: cc.Prefab,
        prefabSeletor: cc.Prefab
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.curShowMercID = -1;
        this.selectview = null;
        this.curSelectIdx = -1;
        this.curSelector = null;
        this.equipTipView = null;
        this.showList = {};
        this.node.getChildByName('closebtn').on(cc.Node.EventType.TOUCH_END, this.attrviewMgr.bind(this));

        //装备按钮注册事件
        var equipNode = this.attrview.getChildByName('equip');
        for (var _i = 1; _i <= EquipPartNumber; _i++) {
            var node = equipNode.getChildByName('' + _i);
            var btn = node.addComponent(cc.Button);
            var click = new cc.Component.EventHandler();
            click.target = this.node;
            click.component = 'attrview';
            click.handler = 'showSelectEquipView';
            click.customEventData = _i;
            btn.clickEvents.push(click);
            node.tag = _i;
        }

        this.onAttrviewEnable(); //界面点击阻止向上传递
    },

    attrviewMgr: function attrviewMgr(mercID) {
        if (this.attrview.active === true) {
            this.attrview.active = false;
            cc.game.infor.curShowMercIdx = -1;
        } else {
            this.attrview.active = true;
            //刷新信息
            // this.showArmygroup();
        }
    },
    init: function init(mercID) {
        cc.log('attrview_init', mercID);
        //在已拥有佣兵表中未查到该佣兵则直接返回
        var ref = cc.game.commonMethod.checkIsHaveMercenary(mercID);
        if (!ref.ref) return;
        this.curShowMercID = mercID;
        this.curShowMercIdx = ref.idx;
        this.attrview.active = true;
        var infor = cc.game.data.mercenary.mercenary[mercID];
        var color = cc.game.commonMethod.quality222Color(infor.quality);

        this.attrview.getChildByName('body').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.armyicon.getSpriteFrame(infor.icon);
        this.attrview.getChildByName('name').getComponent(cc.RichText).string = '<color=' + color.colorText + '>' + infor.name + '</c><color=#0fffff> +666</color>';

        this.refreshEquipIcon();
        this.refreshAttrView();
    },


    //刷新佣兵装备展示
    refreshEquipIcon: function refreshEquipIcon() {
        var equip = cc.game.res.mercenarys[this.curShowMercIdx].equip;
        for (var i in equip) {
            if (equip[i] > 0) {
                var equipview = this.attrview.getChildByName('equip');
                var equipInfor = cc.game.res.items[equip[i]];
                var urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(equipInfor.finalquality);
                equipview.getChildByName(i).getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(equipInfor.icon);
                equipview.getChildByName(i).getChildByName('frame').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);
                equipview.getChildByName(i).zIndex = 10;
            }
        }
    },


    onAttrviewEnable: function onAttrviewEnable() {
        this.attrview.on('touchstart', function (event) {
            event.stopPropagation();
        });
        this.attrview.on('touchend', function (event) {
            event.stopPropagation();
        });
    },
    onAttrviewDisable: function onAttrviewDisable() {
        this.attrview.off('touchstart', function (event) {
            event.stopPropagation();
        });
        this.attrview.off('touchend', function (event) {
            event.stopPropagation();
        });
    },

    showSelectEquipView: function showSelectEquipView(event, customEventData) {
        cc.log('showSelectEquipView', customEventData);
        var self = this;
        if (self.selectview) {
            self.closeSelectView();
        }
        self.removeSelector();
        customEventData = Number(customEventData);
        this.curShowEquipPart = customEventData;
        cc.game.infor.curShowEquipPart = customEventData;
        self.selectview = cc.instantiate(self.prefabSelectview);
        self.node.addChild(self.selectview);
        //根据部位决定布局位置
        if (customEventData <= 3) {
            self.selectview.x = 104;
        } else {
            self.selectview.x = -104;
        }
        self.selectview.active = true;
        self.selectview.getChildByName('cancel').on(cc.Node.EventType.TOUCH_END, self.closeSelectView, self);
        self.selectview.getChildByName('change').on(cc.Node.EventType.TOUCH_END, self.changeEquip, self);
        self.selectview.getChildByName('part').getComponent(cc.Label).string = 'part ' + EquipPartText[customEventData];

        var ref = cc.game.commonMethod.getMercEquip(this.curShowMercIdx, customEventData);
        if (ref <= 0) {
            self.selectview.getChildByName('equiped').active = false;
            self.selectview.getChildByName('noequiped').active = true;
        } else {
            var iconUtrl = cc.game.res.items[ref].icon;
            self.selectview.getChildByName('equiped').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(iconUtrl);
            var str = 'itemframe' + cc.game.commonMethod.quality222Number(cc.game.res.items[ref].finalquality);
            self.selectview.getChildByName('equiped').getChildByName('frame').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(str);
        }

        self.showList = {};
        var length = 0;
        //先清除显示列表
        var content = self.selectview.getChildByName('equipshow').getChildByName('view').getChildByName('content');
        content.removeAllChildren();
        for (var i in cc.game.res.items) {
            if (Number(cc.game.data.items.items[cc.game.res.items[i].id].type) === 6) {
                if (Number(cc.game.res.items[i].part) === customEventData && Number(cc.game.res.items[i].hasequiped) === -1) {
                    ++length;
                    self.showList[length] = cc.instantiate(this.prefabEquip);
                    self.showList[length].equipIdxInBag = Number(i); //equipIdxInBag 装备在背包信息中索引
                    self.showList[length].equipIdxInView = Number(length); //equipIdxInView 装备在选择界面中索引
                    self.showList[length].equipId = Number(cc.game.res.items[i].id); //equipId   装备ID
                    self.showList[length].itemInfor = Object.assign({}, cc.game.res.items[i]);

                    //更换icon
                    self.showList[length].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(cc.game.res.items[i].icon);

                    //更换icon边框frame
                    var urlstr = 'itemframe' + cc.game.res.items[i].finalquality;
                    self.showList[length].getChildByName('frame').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);

                    //注册按钮事件
                    self.showList[length].on(cc.Node.EventType.TOUCH_START, self.showEquipInforView, self);
                    self.showList[length].on(cc.Node.EventType.TOUCH_MOVE, self.showEquipInforView, self);
                    self.showList[length].on(cc.Node.EventType.TOUCH_CANCEL, self.closeEquipInforView, self);
                    self.showList[length].on(cc.Node.EventType.TOUCH_END, self.closeEquipInforView, self);

                    // cc.game.commonMethod.registerParamTouchEvent(self.showList[length], self.node, 'attrview', 'showEquipViewAndSelected', i, length);
                    content.addChild(self.showList[length]);
                }
            }
        }
        if (length < 1) {
            self.selectview.getChildByName('none').active = true;
        }
    },
    closeSelectView: function closeSelectView() {
        if (this.selectview) {
            this.selectview.active = false;
            this.selectview.removeFromParent(true);
            this.selectview = null;
        }
    },


    //显示装备详细信息面板并设置选中
    //customEventData 在背包信息中索引 tag显示列表中索引
    showEquipViewAndSelected: function showEquipViewAndSelected(event, customEventData) {

        var self = this;
        self.removeSelector();
        self.curSelectIdx = Number(event.target.tag);

        self.createSelector();

        //显示装备详细信息面板
        var pos = event.touch.getLocation();
        cc.log('showEquipViewAndSelected', customEventData, self.curSelectIdx, pos);
        var equipView = self.showList[event.target.tag].getComponent('equipjs').init(customEventData); //??
        self.node.addChild(equipView);
    },


    //显示装备详细信息面板并设置选中
    setEquipSelected: function setEquipSelected(event) {

        var self = this;
        self.closeEquipInforView();
        self.removeSelector();
        self.curSelectIdx = event.target.equipIdxInView;

        self.createSelector();
    },


    createSelector: function createSelector() {
        //cc.log('createSelector');
        this.curSelector = cc.instantiate(this.prefabSeletor);
        this.showList[this.curSelectIdx].addChild(this.curSelector);
        this.curSelector.setPosition(0, 0);
    },

    removeSelector: function removeSelector() {
        if (cc.isValid(this.curSelector)) {
            this.curSelector.destroy();
            this.curSelector = null;
            this.curSelectIdx = -1;
        }
    },

    changeEquip: function changeEquip() {
        cc.log('changeEquip', this.curShowMercIdx, cc.game.res.mercenarys[this.curShowMercIdx].id, this.curShowEquipPart, this.curSelectIdx);
        if (this.curSelectIdx < 0) return; //未选中任何装备 直接返回
        if (this.curShowEquipPart === Number(this.showList[this.curSelectIdx].itemInfor.part)) {
            var ref = cc.game.commonMethod.onEquip(this.curShowMercIdx, this.showList[this.curSelectIdx].equipIdxInBag, this.curShowEquipPart);
            if (ref) {
                var q = this.showList[this.curSelectIdx].itemInfor.finalquality;
                var colorInfor = cc.game.commonMethod.quality222Color(q);
                var str = '<color=#FFFFFF>成功穿戴</color><color=' + colorInfor.colorText + '>' + this.showList[this.curSelectIdx].itemInfor.name + '</c>';
                cc.game.commonMethod.addTipText({ type: 2, string: str });
                this.closeSelectView();
                this.refreshEquipIcon();
                this.refreshAttrView();
            }
        }
    },


    //刷新佣兵属性信息
    refreshAttrView: function refreshAttrView() {
        cc.game.commonMethod.censusMercAllAttr(this.curShowMercIdx);

        var infor = cc.game.data.mercenary.mercenary[cc.game.res.mercenarys[this.curShowMercIdx].id];
        var color = cc.game.commonMethod.quality222Color(infor.quality);
        var attrlist = this.attrview.getChildByName('attr').getChildByName('attrLayout');
        var lv = cc.game.res.mercenarys[this.curShowMercIdx].lv;
        attrlist.getChildByName('lv').getChildByName('text').getComponent(cc.Label).string = lv;
        attrlist.getChildByName('lv').getChildByName('text').color = color.color4;
        for (i in AttrViewTab) {
            var key = AttrViewTab[i];
            var value = cc.game.res.mercenarys[this.curShowMercIdx].finalattr[key];
            attrlist.getChildByName(key).getChildByName('text').getComponent(cc.Label).string = value;
            attrlist.getChildByName(key).getChildByName('text').color = color.color4;
        }
    },


    //显示装备详细信息面板
    showEquipInforView: function showEquipInforView(event) {

        var self = this;
        //显示装备详细信息面板
        var pos = event.touch.getLocation();
        cc.log('showEquipInforView', self.curSelectIdx, pos);
        if (!self.equipTipView) {
            self.equipTipView = self.showList[event.target.equipIdxInView].getComponent('equipjs').init(event.target.equipIdxInBag); //??
            self.node.addChild(self.equipTipView);
            self.equipTipView.active = false;
            self.showEquipTipViewTime = 0;
            self.schedule(self.showEquipTipViewTimer, 0.02);

            //设置选中
            //self.closeEquipInforView();
            self.removeSelector();
            self.curSelectIdx = event.target.equipIdxInView;
            self.createSelector();
        }
    },
    closeEquipInforView: function closeEquipInforView(event) {

        cc.log('closeEquipInforView');
        var self = this;
        if (self.equipTipView) {
            self.equipTipView.removeFromParent(true);
            self.equipTipView = null;
            self.showEquipTipViewTime = -1;
            self.unschedule(self.showEquipTipViewTimer);
        }
    },
    showEquipTipViewTimer: function showEquipTipViewTimer(dt) {
        this.showEquipTipViewTime += dt;
        if (this.showEquipTipViewTime > 0.1) {
            this.equipTipView.active = true;
        }
    }
});

cc._RF.pop();
},{}],"battle_basic":[function(require,module,exports){
"use strict";
cc._RF.push(module, '1fa91drp5RHaJ/6nFk/gSuo', 'battle_basic');
// Script/battle/battle_basic.js

'use strict';

var battleBasic = {
    data: null,
    //初始化基本数据
    initBasic: function initBasic() {
        cc.game.battle = {};
        cc.game.battle.attacker = [];
        cc.game.battle.defender = [];
        cc.game.battle.attackFormation = [];
        cc.game.battle.defendFormation = [];
        cc.game.battle.attackSeq = [];
        cc.game.battle.attackSeqIdx = 0;
        cc.game.battle.test = true;
        cc.game.battle.round = 0;
        cc.game.battle.attackMagic = false;
        cc.game.battle.defendMagic = false;
    },


    //初始化阵型信息
    initFormation: function initFormation() {
        //获得双方阵型
        this.getFormation();

        //进攻方
        for (var i in cc.game.battle.attackFormation) {
            //let attack = cc.instantiate(prefab).getComponent('battle_player');
            var attack = {};
            attack.party = 'attack';
            attack.flag = cc.game.battle.attackFormation[i].idx;
            cc.game.battle.attacker.push(attack);
        }
        //防守方
        for (var i in cc.game.battle.defendFormation) {
            //let attack = cc.instantiate(prefab).getComponent('battle_player');
            var defend = {};
            defend.party = 'defend';
            cc.game.battle.defender.push(defend);
        }
    },
    getFormation: function getFormation() {
        if (cc.game.battle.test) {
            //随机双方阵型
            //cc.game.battle.attackFormation = cc.game.commonMethod.randomAverageDistribution(25, 10);
            //cc.game.battle.defendFormation = cc.game.commonMethod.randomAverageDistribution(25, 10);
            cc.game.battle.attackFormation = cc.game.res.formation.posInfor;
            cc.game.battle.defendFormation = cc.game.commonMethod.randomAverageDistribution(25, cc.game.commonMethod.getOnFormationCount());
        }
    },
    budget: function budget() {
        if (cc.game.battle.test) {
            for (var i in cc.game.battle.attacker) {
                cc.game.battle.attackSeq.push(cc.game.battle.attacker[i]);
            }
            for (var i in cc.game.battle.defender) {
                cc.game.battle.attackSeq.push(cc.game.battle.defender[i]);
            }
            //模拟双方属性
            for (var i in cc.game.battle.attackSeq) {
                //不显示过程需模拟数据
                if (!cc.game.battle.attackSeq[i].player) {
                    cc.game.battle.attackSeq[i].player = {};
                    cc.game.battle.attackSeq[i].player.node = {};
                }
                cc.game.battle.attackSeq[i].player.node.combatAttri = {};
                cc.game.battle.attackSeq[i].player.node.combatAttri.attk = cc.game.commonMethod.randomInt(50) + 1;
                cc.game.battle.attackSeq[i].player.node.combatAttri.def = cc.game.commonMethod.randomInt(10) + 1;
                cc.game.battle.attackSeq[i].player.node.combatAttri.maxHp = cc.game.commonMethod.randomInt(100) + 1;
                cc.game.battle.attackSeq[i].player.node.combatAttri.curHp = cc.game.battle.attackSeq[i].player.node.combatAttri.maxHp;
                cc.game.battle.attackSeq[i].player.node.combatAttri.speed = cc.game.commonMethod.randomFloat(50) + 1;
                cc.game.battle.attackSeq[i].player.node.combatAttri.state = [{ tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }]; //状态位
            }
        }

        //??正常流程属性读取

        //计算出手顺序
        for (var i = 0; i < cc.game.battle.attackSeq.length; i++) {
            for (var j = i + 1; j < cc.game.battle.attackSeq.length; j++) {
                if (cc.game.battle.attackSeq[i].player.node.combatAttri.speed < cc.game.battle.attackSeq[j].player.node.combatAttri.speed) {
                    var temp = cc.game.battle.attackSeq[j];
                    cc.game.battle.attackSeq[j] = cc.game.battle.attackSeq[i];
                    cc.game.battle.attackSeq[i] = temp;
                }
            }
        }
        // for(var i in cc.game.battle.attackSeq){
        //     cc.log('最终出手顺序',cc.game.battle.attackSeq[i].player.node.combatAttri.speed);
        // }
    },
    checkIsAlive: function checkIsAlive(node) {
        var ref = false;
        if (node) {
            if (node.combatAttri.curHp > 0) {
                ref = true;
            }
        } else {
            if (cc.game.battle.attackSeq[cc.game.battle.attackSeqIdx].player.node.combatAttri.curHp > 0) {
                ref = true;
            }
        }
        return ref;
    },
    checkIsActive: function checkIsActive() {
        var ref = true;
        return ref;
    },
    checkIsOver: function checkIsOver() {
        var attackDead = 0;
        var attacker = 0;
        var defendDead = 0;
        var defender = 0;
        //先检测攻方是否还有单位存活
        for (var i in cc.game.battle.attackSeq) {
            if (cc.game.battle.attackSeq[i].party === 'attack') {
                ++attacker;
                if (!this.checkIsAlive(cc.game.battle.attackSeq[i].player.node)) {
                    ++attackDead;
                }
            }
        }
        if (attackDead === attacker) {
            //攻方死完
            return cc.game.infor.battleResult = 2;
        }
        //检测防方是否还有单位存活
        for (var i in cc.game.battle.attackSeq) {
            if (cc.game.battle.attackSeq[i].party === 'defend') {
                ++defender;
                if (!this.checkIsAlive(cc.game.battle.attackSeq[i].player.node)) {
                    ++defendDead;
                }
            }
        }
        if (defendDead === defender) {
            //防方死完
            return cc.game.infor.battleResult = 1;
        }
        return cc.game.infor.battleResult = 0;
    },
    getTargetPos: function getTargetPos(target) {
        return target.player.node.getPosition();
    },
    calcAttackData: function calcAttackData() {
        //cc.log('doAttack');
        var target = this.selectTarget();

        //伤害计算
        var damage = this.calcDamage(cc.game.battle.attackSeq[cc.game.battle.attackSeqIdx], target);
        var per = Math.round(damage / target.player.node.combatAttri.maxHp * 100) / 100;
        target.player.node.combatAttri.curHp -= damage;

        return { target: target, per: per, damage: damage };
    },
    calcDamage: function calcDamage(node, target) {
        var attk = cc.game.commonMethod.drift(node.player.node.combatAttri.attk, 0.85, 1.15);
        var def = cc.game.commonMethod.drift(target.player.node.combatAttri.def, 0.95, 1.02);
        var damage = 0;
        if (attk > def) {
            damage = Math.round(attk - def);
        } else {}
        // cc.log('calcDamage', damage);
        //cc.log(attk, node.player.node.combatAttri.attk, def, target.player.node.combatAttri.def);
        return damage;
    },
    selectTarget: function selectTarget() {
        var n = 0; //防止空对象
        var nn = 0; //记录极端概率
        var party = cc.game.battle.attackSeq[cc.game.battle.attackSeqIdx].party;
        var count = 0;
        for (var i in cc.game.battle.attackSeq) {
            if (cc.game.battle.attackSeq[i].party !== party) {
                if (this.checkIsAlive(cc.game.battle.attackSeq[i].player.node) && this.checkIsActive(cc.game.battle.attackSeq[i].player.node)) {
                    ++count;
                }
            }
        }
        var per = 0;
        for (var i in cc.game.battle.attackSeq) {
            if (cc.game.battle.attackSeq[i].party !== party) {
                if (this.checkIsAlive(cc.game.battle.attackSeq[i].player.node) && this.checkIsActive(cc.game.battle.attackSeq[i].player.node)) {
                    per += 1 / count;
                    var rand = Math.random();
                    if (rand <= per) {
                        return cc.game.battle.attackSeq[i];
                    }
                    n = i;
                    nn = rand;
                }
            }
        }
        cc.log('selectTarget:无目标', count, per, nn);
        return cc.game.battle.attackSeq[n];
    },
    casttingMagic: function casttingMagic() {
        cc.game.battle.attackMagic = true;
        cc.game.battle.defendMagic = true;
    },
    calcBattleResult: function calcBattleResult() {
        //cc.log('calcBattleResult');

        //基础数据
        this.initBasic(cc.game.battle);
        //初始化双方阵型
        this.initFormation();
        //战前属性预算
        this.budget();
        //战斗整个流程
        while (cc.game.battle.round <= 30 && 1) {
            cc.game.battle.attackSeqIdx = -1;
            this.casttingMagic();
            for (var i in cc.game.battle.attackSeq) {
                ++cc.game.battle.attackSeqIdx;
                if (this.checkIsAlive() && this.checkIsActive()) {
                    this.calcAttackData();
                    if (this.checkIsOver() > 0) {
                        cc.log('calcBattleResult', cc.game.infor.battleResult);
                        //退出战斗 返回之前场景
                        //?? 更换野外界面战斗标记
                        cc.loader.loadRes('ui/randomEventHole' + cc.game.randomEventSprite.tag, cc.SpriteFrame, function (err, SpriteFrame) {
                            cc.game.randomEventSprite.getComponent(cc.Sprite).spriteFrame = SpriteFrame;
                        });
                        //heroFsm.reStart();
                        cc.game.wildCtrl.wildFsmRestart();
                        return;
                    }
                }
            }
            ++this.round;
        }
    }
};
module.exports = battleBasic;

cc._RF.pop();
},{}],"battle_main":[function(require,module,exports){
"use strict";
cc._RF.push(module, '3a6datP4vFJF5c01B+04D+t', 'battle_main');
// Script/battle/battle_main.js

'use strict';

//const data = require('data');
var heroFsm = require('wild_control');
var battleBasic = require('battle_basic');
var battleFsm = new StateMachine({
    data: {
        battle: null
    },
    transitions: [{ name: 'roundStart', from: 'none', to: 'start' }, { name: 'castMagic', from: 'start', to: 'magiced' }, { name: 'Player', from: 'magiced', to: 'playerActionEnd' }, { name: 'roundEnd', from: 'playerActionEnd', to: 'end' }, { name: 'reround', from: 'end', to: 'start' }, { name: 'reset', from: ['start', 'magiced', 'playerActionEnd', 'end'], to: 'none' }],
    methods: {
        onStart: function onStart() {
            battle.nextRound();

            //battleFsm.castMagic();

            setTimeout(function () {
                battleFsm.castMagic();
            }, interval);
        },
        onCastMagic: function onCastMagic() {
            //battle.casttingMagic();
            battleBasic.casttingMagic(); //??

            //battleFsm.Player();
            setTimeout(function () {
                battleFsm.Player();
            }, interval);
        },
        onPlayer: function onPlayer() {
            turnFsm.start();
        },
        onRoundEnd: function onRoundEnd() {
            setTimeout(function () {
                battleFsm.reround();
            }, interval);
        },
        onEnterState: function onEnterState(lifecycle) {
            // cc.log('battleFsm:' + lifecycle.to);
            battle.debug1.getComponent(cc.Label).string = 'battleFsm:' + lifecycle.to;
        }
    }
});

var turnFsm = new StateMachine({
    data: {
        battle: null
    },
    transitions: [//开始检测行动性 行动前事件 攻击 行动后事件 
    { name: 'start', from: 'none', to: 'beforeEvent' }, { name: 'dealBeforeEvent', from: 'beforeEvent', to: 'firstCheck' }, { name: 'firstCheckFinish', from: 'firstCheck', to: 'secondCheck' }, { name: 'firstCheckFalse', from: 'firstCheck', to: 'end' }, { name: 'secondCheckFinish', from: 'secondCheck', to: 'attack' }, { name: 'secondCheckFalse', from: 'secondCheck', to: 'end' }, { name: 'attackFinish', from: 'attack', to: 'attackEnd' }, { name: 'dealAfterEvent', from: 'attackEnd', to: 'end' }, { name: 'next', from: 'end', to: 'nextend' }, { name: 'start', from: 'nextend', to: 'beforeEvent' }, { name: 'reset', from: ['beforeEvent', 'firstCheck', 'secondCheck', 'attack', 'attackEnd', 'end', 'nextend'], to: 'none' }],
    methods: {
        onBeforeEvent: function onBeforeEvent() {
            // cc.log('onBeforeEvent');
            setTimeout(function () {
                battle.eventBeforeAction();
            }, interval);
        },
        onFirstCheck: function onFirstCheck() {
            // cc.log('onFirstCheck');
            setTimeout(function () {
                battle.playerFirstCheck();
            }, interval);
        },
        onEnd: function onEnd() {
            // cc.log('onEnd');
            setTimeout(function () {
                turnFsm.next();
            }, interval);
        },
        onSecondCheck: function onSecondCheck() {
            setTimeout(function () {
                battle.playerSecondCheck();
            }, interval);
        },
        onAttack: function onAttack() {
            setTimeout(function () {
                battle.doAttack();
            }, interval);
        },
        onAttackEnd: function onAttackEnd() {
            // cc.log('onAttackEnd');

            setTimeout(function () {
                battle.eventAfterAction();
            }, interval);
        },
        onNext: function onNext() {
            //cc.log('onNext');
            setTimeout(function () {
                battle.nextPlayer();
            }, interval);
        },
        onEnterState: function onEnterState(lifecycle) {
            // cc.log('turnFsm:' + lifecycle.to);
            battle.debug2.getComponent(cc.Label).string = 'turnFsm:' + lifecycle.to;
        }
    }
});

var battle = null;
var interval = 10;

var battleMain = cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        bg: cc.Node,
        attackerLoc: [cc.Node],
        defenderLoc: [cc.Node],
        roundTip: cc.Label,
        debug1: cc.Label,
        debug2: cc.Label,
        playerPrefab: cc.Prefab,
        endUI: cc.Node,
        canvas: cc.Node
    },

    // use this for initialization
    // onLoad() {

    //     if(!cc.game.infor.skipBattle){
    //         this.canvas.opacity = 255;
    //         //基础数据
    //         this.initBasic();

    //         battle = this;

    //         this.bg.getChildByName('skip').on(cc.Node.EventType.TOUCH_END, this.skipBattle.bind(this))
    //         this.endUI.getChildByName('back').on(cc.Node.EventType.TOUCH_END, this.hideEndUI.bind(this));

    //         //预加载下个场景
    //         //加载战斗背景
    //         //初始化双方阵型
    //         this.initPlayers();
    //         //战前属性预算
    //         this.budget();
    //         //战斗倒计时
    //         this.schedule(this.refreshCountDown, 1);
    //     }else{
    //         this.canvas.opacity = 0;
    //         this.calcBattleResult();
    //     }
    // },

    onLoad: function onLoad() {

        //初始化数据
        this.initBasic();

        battle = this;
        this.bg.getChildByName('skip').on(cc.Node.EventType.TOUCH_END, this.skipBattle.bind(this));
        this.endUI.getChildByName('back').on(cc.Node.EventType.TOUCH_END, this.hideEndUI.bind(this));
        //预加载下个场景
        //加载战斗背景
        //初始化双方阵型
        this.initPlayers();
        //战前属性预算
        battleBasic.budget();
        //战斗倒计时
        this.schedule(this.refreshCountDown, 1);
    },


    // initBasic(){
    //     interval = 10;
    //     this.skipSwitch = false;        //快速战斗开关
    //     this.attacker = [];
    //     this.defender = [];
    //     this.attackFormation = [];
    //     this.defendFormation = [];
    //     this.attackSeq = [];
    //     this.attackSeqIdx = 0;
    //     this.test = true;           //测试专用
    //     this.round = 0;
    //     this.countDown = 1;
    //     this.closeEndUI = -1        //关闭结束界面倒计时
    //     this.attackMagic = false;       //攻方本回合技能是否已释放
    //     this.defendMagic = false;
    // },

    initBasic: function initBasic() {

        //表现相关数据
        interval = 10;
        this.skipSwitch = false; //快速战斗开关
        this.countDown = 1;
        this.closeEndUI = -1; //关闭结束界面倒计时

        battleBasic.initBasic();
    },


    // initPlayers(){
    //     //获取双方位置
    //     this.getFormation();

    //     //进攻方
    //     for(var i in this.attackFormation){
    //         let attack = cc.instantiate(this.playerPrefab).getComponent('battle_player');
    //         attack.party = 'attack';
    //         this.attacker.push(attack);
    //         //this.attackerLoc[i].parent.addChild(attack.node);
    //         this.attackerLoc[this.attackFormation[i]].parent.addChild(attack.node);
    //         attack.node.position = this.attackerLoc[this.attackFormation[i]].position;
    //         attack.init(this);
    //     }
    //     this.attackerCount = this.attackerLoc.length;
    //     this.attackerAliveCount = this.attackerCount;
    //     //防守方
    //     for(var i in this.defendFormation){
    //         let defend = cc.instantiate(this.playerPrefab).getComponent('battle_player');
    //         defend.party = 'defend';
    //         defend.node.scaleX = -1;
    //         this.defender.push(defend);
    //         //this.defenderLoc[i].parent.addChild(defend.node);
    //         this.defenderLoc[this.defendFormation[i]].parent.addChild(defend.node);
    //         defend.node.position = this.defenderLoc[this.defendFormation[i]].position;
    //         defend.init(this);
    //     }
    //     this.defenderCount = this.defenderLoc.length;
    //     this.defenderAliveCount = this.defenderCount;
    // },

    initPlayers: function initPlayers() {
        battleBasic.initFormation();

        //进攻方
        // for(var i in cc.game.battle.attackFormation){
        //     let attack = cc.instantiate(this.playerPrefab).getComponent('battle_player');
        //     cc.game.battle.attacker[i].player = attack;
        //     this.attackerLoc[i].parent.addChild(attack.node);
        //     attack.node.position = this.attackerLoc[cc.game.battle.attackFormation[i]].position;
        //     attack.init(this);
        // }
        for (var i in cc.game.battle.attackFormation) {
            var attack = cc.instantiate(this.playerPrefab).getComponent('battle_player');
            cc.game.battle.attacker[i].player = attack;
            this.attackerLoc[i].parent.addChild(attack.node);
            attack.node.position = this.attackerLoc[cc.game.battle.attackFormation[i].pos].position;
            attack.init(this);
        }

        //防守方
        for (var i in cc.game.battle.defendFormation) {
            var defend = cc.instantiate(this.playerPrefab).getComponent('battle_player');
            cc.game.battle.defender[i].player = defend;
            defend.node.scaleX = -1;
            this.defenderLoc[i].parent.addChild(defend.node);
            defend.node.position = this.defenderLoc[cc.game.battle.defendFormation[i]].position;
            defend.init(this);
        }
    },
    budget: function budget() {
        if (this.test) {
            for (var i in this.attacker) {
                this.attackSeq.push(this.attacker[i]);
            }
            for (var i in this.defender) {
                this.attackSeq.push(this.defender[i]);
            }
            //模拟双方战斗属性
            for (var i in this.attackSeq) {
                this.attackSeq[i].node.combatAttri = {};
                this.attackSeq[i].node.combatAttri.attk = cc.game.commonMethod.randomInt(50) + 1;
                this.attackSeq[i].node.combatAttri.def = cc.game.commonMethod.randomInt(10) + 1;
                this.attackSeq[i].node.combatAttri.maxHp = cc.game.commonMethod.randomInt(100) + 1;
                this.attackSeq[i].node.combatAttri.curHp = this.attackSeq[i].node.combatAttri.maxHp;
                this.attackSeq[i].node.combatAttri.speed = cc.game.commonMethod.randomFloat(50) + 1;
                this.attackSeq[i].node.combatAttri.state = [{ tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }, { tab: 0, round: 0, number: 0 }]; //状态位
            }
        }

        //正常流程属性读取？？

        //计算出手顺序
        for (var i = 0; i < this.attackSeq.length; i++) {
            for (var j = i + 1; j < this.attackSeq.length; j++) {
                if (this.attackSeq[i].node.combatAttri.speed < this.attackSeq[j].node.combatAttri.speed) {
                    var temp = this.attackSeq[j];
                    this.attackSeq[j] = this.attackSeq[i];
                    this.attackSeq[i] = temp;
                }
            }
        }
        // for(var i in this.attackSeq){
        //     cc.log('最终出手顺序',this.attackSeq[i].node.combatAttri.speed);
        // }
    },
    refreshCountDown: function refreshCountDown(dt) {
        this.roundTip.getComponent(cc.Label).string = '战斗倒计时\n' + this.countDown;
        if (this.countDown === 0) {
            this.unschedule(this.refreshCountDown);
            battleFsm.roundStart();
        }
        --this.countDown;
    },


    // nextRound(){
    //     ++this.round;
    //     this.attackMagic = false;
    //     this.defendMagic = false;
    //     this.roundTip.getComponent(cc.Label).string = '第' + this.round + '回合';
    // },

    nextRound: function nextRound() {
        ++cc.game.battle.round;
        cc.game.battle.attackMagic = false;
        cc.game.battle.defendMagic = false;
        this.roundTip.getComponent(cc.Label).string = '第' + cc.game.battle.round + '回合';
    },


    // playerFirstCheck(){
    //     if(this.checkIsAlive() && this.checkIsActive()){
    //         turnFsm.firstCheckFinish();
    //     }else{
    //         turnFsm.firstCheckFalse();
    //     }
    // },

    playerFirstCheck: function playerFirstCheck() {
        if (battleBasic.checkIsAlive() && battleBasic.checkIsActive()) {
            turnFsm.firstCheckFinish();
        } else {
            turnFsm.firstCheckFalse();
        }
    },


    // playerSecondCheck(){
    //     if(this.checkIsAlive() && this.checkIsActive()){
    //         turnFsm.secondCheckFinish();
    //     }else{
    //         turnFsm.secondCheckFalse();
    //     }
    // },

    playerSecondCheck: function playerSecondCheck() {
        if (battleBasic.checkIsAlive() && battleBasic.checkIsActive()) {
            turnFsm.secondCheckFinish();
        } else {
            turnFsm.secondCheckFalse();
        }
    },
    checkIsAlive: function checkIsAlive(node) {
        var ref = false;
        if (node) {
            if (node.combatAttri.curHp > 0) {
                ref = true;
            }
        } else {
            if (this.attackSeq[this.attackSeqIdx].node.combatAttri.curHp > 0) {
                ref = true;
            }
        }
        return ref;
    },
    checkIsActive: function checkIsActive() {
        var ref = true;
        return ref;
    },


    //行动前事件
    eventBeforeAction: function eventBeforeAction() {
        //cc.log('eventBeforeAction');

        //??

        turnFsm.dealBeforeEvent();
    },


    // eventAfterAction(){
    //     //cc.log('eventAfterAction');
    //     //判断战斗是否结束
    //     if(this.checkIsOver() === 0){
    //         turnFsm.dealAfterEvent();
    //     }else{                                  //显示结束界面 1胜利 2失败
    //         this.showEndUI();
    //     }
    // },

    eventAfterAction: function eventAfterAction() {
        //cc.log('eventAfterAction');
        //判断战斗是否结束
        if (battleBasic.checkIsOver() === 0) {
            turnFsm.dealAfterEvent();
        } else {
            //显示结束界面 1胜利 2失败
            this.showEndUI();
        }
    },
    checkIsOver: function checkIsOver() {
        var attackDead = 0;
        var attacker = 0;
        var defendDead = 0;
        var defender = 0;
        //先检测攻方是否还有单位存活
        for (var i in this.attackSeq) {
            if (this.attackSeq[i].party === 'attack') {
                ++attacker;
                if (!this.checkIsAlive(this.attackSeq[i].node)) {
                    ++attackDead;
                }
            }
        }
        if (attackDead === attacker) {
            //攻方死完
            return cc.game.infor.battleResult = 2;
        }
        //检测防方是否还有单位存活
        for (var i in this.attackSeq) {
            if (this.attackSeq[i].party === 'defend') {
                ++defender;
                if (!this.checkIsAlive(this.attackSeq[i].node)) {
                    ++defendDead;
                }
            }
        }
        if (defendDead === defender) {
            //防方死完
            return cc.game.infor.battleResult = 1;
        }
        return cc.game.infor.battleResult = 0;
    },
    showEndUI: function showEndUI() {
        this.endUI.active = true;
        this.closeEndUI = 5;
        cc.director.preloadScene('wild');
        if (cc.game.infor.battleResult === 1) {
            this.endUI.getChildByName('result').getComponent(cc.Label).string = '战斗胜利';
        } else {
            this.endUI.getChildByName('result').getComponent(cc.Label).string = '战斗失败';
        }
        this.endUI.getChildByName('tip').getComponent(cc.Label).string = Math.round(this.closeEndUI) + '秒后自动关闭';
        this.schedule(this.endUICountDown, 1);
    },
    endUICountDown: function endUICountDown(dt) {
        this.closeEndUI -= dt;
        this.endUI.getChildByName('tip').getComponent(cc.Label).string = Math.round(this.closeEndUI) + '秒后自动关闭';
        if (this.closeEndUI <= 0) {
            this.unschedule(this.endUICountDown);
            this.hideEndUI();
        }
    },
    hideEndUI: function hideEndUI() {
        this.endUI.active = false;
        //heroFsm.setResult(this.battleResult);
        this.initBasic();
        turnFsm.reset();
        battleFsm.reset();
        cc.audioEngine.stopAll();
        this.backScene('wild');
    },


    // getTargetPos(target){
    //     return target.node.getPosition();
    // },

    getTargetPos: function getTargetPos(target) {
        return target.player.node.getPosition();
    },


    // doAttack(){
    //     //cc.log('doAttack');
    //     let target = this.selectTarget();
    //     let targetPos = this.getTargetPos(target);
    //     //伤害计算
    //     let damage = this.calcDamage(this.attackSeq[this.attackSeqIdx], target);
    //     let per = Math.round((damage/target.node.combatAttri.maxHp)*100)/100;
    //     target.node.combatAttri.curHp -= damage;

    //     if(!cc.game.infor.skipBattle){
    //         this.attackSeq[this.attackSeqIdx].attckTarget(target, targetPos, per, this.skipSwitch);
    //         if(this.skipSwitch){
    //             this.onAttackComplete();
    //         }
    //     }
    // },

    doAttack: function doAttack() {
        //cc.log('doAttack');
        var ref = battleBasic.calcAttackData();
        var targetPos = this.getTargetPos(ref.target);

        if (!cc.game.infor.skipBattle) {
            cc.game.battle.attackSeq[cc.game.battle.attackSeqIdx].player.attckTarget(ref, targetPos, this.skipSwitch);
            if (this.skipSwitch) {
                this.onAttackComplete();
            }
        }
    },
    calcDamage: function calcDamage(node, target) {
        var attk = cc.game.commonMethod.drift(node.node.combatAttri.attk, 0.85, 1.15);
        var def = cc.game.commonMethod.drift(target.node.combatAttri.def, 0.95, 1.02);
        cc.log(attk, node.node.combatAttri.attk, def, target.node.combatAttri.def);
        return attk - def;
    },
    selectTarget: function selectTarget() {
        var n = 0; //防止空对象
        var nn = 0; //记录极端概率
        var party = this.attackSeq[this.attackSeqIdx].party;
        var count = 0;
        for (var i in this.attackSeq) {
            if (this.attackSeq[i].party !== party) {
                if (this.checkIsAlive(this.attackSeq[i].node) && this.checkIsActive(this.attackSeq[i].node)) {
                    ++count;
                }
            }
        }
        var per = 0;
        for (var i in this.attackSeq) {
            if (this.attackSeq[i].party !== party) {
                if (this.checkIsAlive(this.attackSeq[i].node) && this.checkIsActive(this.attackSeq[i].node)) {
                    per += 1 / count;
                    var rand = Math.random();
                    if (rand <= per) {
                        return this.attackSeq[i];
                    }
                    n = i;
                    nn = rand;
                }
            }
        }
        cc.log('selectTarget:无目标', count, per, nn);
        return this.attackSeq[n];
    },
    onAttackComplete: function onAttackComplete() {
        //cc.log('onAttackComplete');
        turnFsm.attackFinish();
    },


    // nextPlayer(){
    //     ++this.attackSeqIdx;
    //     if(this.attackSeqIdx >= this.attackSeq.length){
    //         this.attackSeqIdx = 0;
    //         battleFsm.roundEnd();
    //     }else{
    //         turnFsm.start();
    //     }
    // },

    nextPlayer: function nextPlayer() {
        ++cc.game.battle.attackSeqIdx;
        if (cc.game.battle.attackSeqIdx >= cc.game.battle.attackSeq.length) {
            cc.game.battle.attackSeqIdx = 0;
            battleFsm.roundEnd();
        } else {
            turnFsm.start();
        }
    },
    casttingMagic: function casttingMagic() {
        this.attackMagic = true;
        this.defendMagic = true;
    },
    skipBattle: function skipBattle() {
        // 先看现在战斗进行到哪一步
        // 继续完成剩下战斗计算
        // if(this.attackSeqIdx)
        this.skipSwitch = true;
        interval = 0.01;
    },
    getFormation: function getFormation() {
        if (this.test) {
            //随机双方阵型
            this.attackFormation = cc.game.commonMethod.randomAverageDistribution(25, 10);
            this.defendFormation = cc.game.commonMethod.randomAverageDistribution(25, 10);
            cc.log('getFormation', this.attackFormation, this.defendFormation);
        }
    },
    calcBattleResult: function calcBattleResult() {
        cc.log('calcBattleResult');

        //基础数据
        this.initBasic();
        //初始化双方阵型
        this.initPlayers();
        //战前属性预算
        this.budget();
        //战斗整个流程
        while (this.round <= 30 && 1) {
            this.attackSeqIdx = -1;
            this.casttingMagic();
            for (var i in this.attackSeq) {
                ++this.attackSeqIdx;
                if (this.checkIsAlive() && this.checkIsActive()) {
                    this.doAttack();
                    if (this.checkIsOver() > 0) {
                        //退出战斗 返回之前场景
                        this.backScene('town');
                        return;
                    }
                }
            }
            ++this.round;
        }
    },
    backScene: function backScene(scene) {
        cc.director.loadScene(scene);
        //?? 更换野外界面战斗标记
        cc.loader.loadRes('ui/randomEventHole' + cc.game.randomEventSprite.tag, cc.SpriteFrame, function (err, SpriteFrame) {
            cc.game.randomEventSprite.getComponent(cc.Sprite).spriteFrame = SpriteFrame;
        });
        heroFsm.reStart();
    }
});

module.exports = {
    battleFsm: battleFsm,
    turnFsm: turnFsm
};

cc._RF.pop();
},{"battle_basic":"battle_basic","wild_control":"wild_control"}],"battle_player":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'caca4Csy6xJqpz8eD13PBev', 'battle_player');
// Script/battle/battle_player.js

'use strict';

var TweenLite = require('TweenLite');
var State = cc.Enum({
    Idle: -1,
    Run: -1,
    Attack: -1,
    Cast: -1,
    Hurt: -1
});

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        sprite: cc.Sprite,
        anim: cc.Animation,
        moveDuration: 0,
        attackOffset: 0,
        bloodBar: cc.Node,
        damageNumber: cc.Prefab
    },

    // use this for initialization
    onLoad: function onLoad() {},
    init: function init(battle) {
        this.battle = battle;
        this.initPos = this.node.position;
        this.initScaleX = this.node.scaleX;
        this.bindAttckComplete = this.onAttackComplete.bind(this);
        this.initBloodBar();
    },
    initBloodBar: function initBloodBar() {
        this.bloodBar.active = true;
        var bar = this.bloodBar.getChildByName('bar');
        bar.progress = 0;
        //如果是防守方 血条 翻转
        if (this.initScaleX === -1) {
            this.bloodBar.getComponent(cc.ProgressBar).reverse = this.bloodBar.getComponent(cc.ProgressBar).reverse ? false : true;
        }
        // cc.log('initBloodBar',this.bloodBar.getComponent(cc.ProgressBar).reverse);
    },
    onAttackComplete: function onAttackComplete() {
        this.node.scaleX = -this.initScaleX;
        this.moveTo(this.initPos, this.onMoveBackComplete.bind(this));
        this.anim.off('finished', this.bindAttckComplete);
    },
    onMoveBackComplete: function onMoveBackComplete() {
        this.node.scaleX = this.initScaleX;
        this.playAnim(State.Idle);
        this.battle.onAttackComplete();
    },
    attckTarget: function attckTarget(ref, targetPos, flag) {
        var _this = this;

        var self = this;
        self.target = ref.target;
        if (flag) {
            self.target.player.node.getChildByName('bloodbar').getComponent(cc.ProgressBar).progress += ref.per;
        } else {
            var offsetDir = ref.target.player.node.x > self.node.x ? 1 : -1;
            var targetX = targetPos.x - self.attackOffset * offsetDir;
            self.moveTo(cc.p(targetX, targetPos.y), self.onMoveOutComplete.bind(self));
            //刷新血条
            self.target.per = self.target.player.node.getChildByName('bloodbar').getComponent(cc.ProgressBar).progress + ref.per;
            self.target.perInc = ref.per / 8;
            self.schedule(self.bloodbarUpdate, 0.02);
            //冒伤害
            self.target.player.damageNumSprite = cc.instantiate(self.damageNumber);
            //如果是防守方 伤害冒字翻转
            if (self.target.player.initScaleX === -1) {
                self.target.player.damageNumSprite.scaleX = -1;
            }
            self.target.player.damageNumSprite.getComponent(cc.Label).string = -ref.damage;
            var offset = 180;
            offset -= parseInt(180 * ref.per);
            //设置伤害颜色 红色为伤害 绿色为治疗
            if (ref.damage >= 0) {
                self.target.player.damageNumSprite.color = cc.color(255, offset, offset, 255);
            } else {
                self.target.player.damageNumSprite.color = cc.color(offset, 255, offset, 255);
            }
            self.target.player.damageNumSprite.parent = self.target.player.node;
            var callback = cc.callFunc(function () {
                _this.target.player.damageNumSprite.destroy();
            });
            self.target.player.damageNumSprite.runAction(cc.sequence(cc.spawn(cc.moveBy(2, cc.p(0, 20)), cc.fadeOut(2)), callback));
        }
    },
    bloodbarUpdate: function bloodbarUpdate(dt) {
        var self = this;
        var flag = true; //百分比异常标记
        var bar = self.target.player.node.getChildByName('bloodbar').getComponent(cc.ProgressBar);
        bar.progress += self.target.perInc;
        if (bar.progress > 1) {
            bar.progress = 1;
            flag = false;
        } else if (bar.progress < 0) {
            bar.progress = 0;
            flag = false;
        }
        if (self.target.perInc > 0 && bar.progress >= self.target.per) {
            bar.progress = self.target.per;
            flag = false;
        } else if (self.target.perInc < 0 && bar.progress <= self.target.per) {
            bar.progress = self.target.per;
            flag = false;
        }
        if (!flag) {
            self.unschedule(self.bloodbarUpdate);
        }
        if (bar.progress <= 0.2) {
            bar.node.color = cc.Color.GREEN; //'#FF0000';
        } else if (bar.progress > 0.2 && bar.progress <= 0.7) {
            bar.node.color = cc.Color.ORANGE; //'#FFA300';
        } else {
            bar.node.color = cc.Color.RED; //'#00FF47';
        }
    },
    onMoveOutComplete: function onMoveOutComplete() {
        this.playAnim(State.Attack, this.bindAttckComplete);
        this.target.player.hurt();
    },
    hurt: function hurt() {
        this.playAnim(State.Hurt);
    },
    playAnim: function playAnim(state, callback) {
        this.anim.play(State[state].toLowerCase());
        if (callback) {
            this.anim.on('finished', callback);
        }
    },
    moveTo: function moveTo(pos, callback) {
        TweenLite.to(this.node, this.moveDuration, {
            x: pos.x,
            y: pos.y,
            ease: Power2.easeOut,
            onComplete: callback
        });
        this.playAnim(State.Run);
    }
});

cc._RF.pop();
},{"TweenLite":"TweenLite"}],"btn":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'ae824/ASAJBu6SXkhpY5DE2', 'btn');
// Script/login/btn.js

'use strict';

var storageManager = require('storageManager');
var dataManager = require('dataManager');
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.log('btn_onLoad');
    },

    startGame: function startGame() {
        cc.log('startGame');
        cc.director.loadScene('town');
    },

    createAndStartGame: function createAndStartGame() {
        var editBox = this.node.parent.getChildByName('accountEditBox').getComponent(cc.EditBox);

        var num = 10000 + (Math.random() * 100 | 0);
        cc.log('createAndStartGame()', num, editBox.string);
        // storageManager.writeData({type: 'userID', value: num});
        // storageManager.writeData({type: 'nickName', value: editBox.string});
        dataManager.coverData({ type: 'userID', value: num });
        dataManager.coverData({ type: 'nickName', value: editBox.string });
        cc.director.loadScene('town');
    }

});

cc._RF.pop();
},{"dataManager":"dataManager","storageManager":"storageManager"}],"cheet":[function(require,module,exports){
"use strict";
cc._RF.push(module, '200c6MkpSRA7os9YmD9UnvD', 'cheet');
// Script/town/cheet.js

'use strict';

var dataManager = require('dataManager');

var goldNum = 5000;
var rmbNum = 1000;
var vitNum = 100;

var cheet = cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        var gnode = this.node.getChildByName('goldcheet');
        gnode.on('mousedown', function (event) {
            // dataManager.changeData({type: 'gold', value: goldNum});
            // let n = parseInt(Math.random()*5 +1);
            // cc.log('cheet mmm', n);
            // cc.game.commonMethod.gainNewMercenary(n);

            var qnum = cc.game.commonMethod.randomIntWithRange(1, 4);
            cc.log('eee add', qnum);
            var itemid = cc.game.commonMethod.randomIntWithRange(17, 28);
            cc.game.commonMethod.itemsChangeData(itemid, 1, qnum);
        });

        var rnode = this.node.getChildByName('rmbcheet');
        rnode.on('mousedown', function (event) {
            // dataManager.changeData({type: 'rmb', value: rmbNum});
            // let n = parseInt(Math.random()*10 +1);
            // cc.log('cheet iii', n);
            // cc.game.commonMethod.itemsChangeData(n, 1);
            var qnum = cc.game.commonMethod.randomIntWithRange(1, 4);
            cc.log('eee add', qnum);
            var itemid = cc.game.commonMethod.randomIntWithRange(17, 28);
            cc.game.commonMethod.itemsChangeData(itemid, 1, qnum);
        });

        var vnode = this.node.getChildByName('vitcheet');
        vnode.on('mousedown', function (event) {
            dataManager.changeData({ type: 'vit', value: vitNum });
        });

        if (!cc.game.infor.test) {
            this.node.active = false;
        }
        var children = this.node.children;
        for (var i in children) {
            children[i].active = false;;
        }
    },

    check: function check(sender) {
        //cc.log('check', sender.string);
        switch (sender.string) {
            case 'show me the gold':
            case '111':
                if (cc.game.infor.cheetSwtich) {
                    dataManager.changeData({ type: 'gold', value: goldNum });
                }

                break;
            case 'show me the rmb':
            case '222':
                if (cc.game.infor.cheetSwtich) {
                    dataManager.changeData({ type: 'rmb', value: rmbNum });
                }
                break;
            case 'show me the vit':
            case '333':
                if (cc.game.infor.cheetSwtich) {
                    dataManager.changeData({ type: 'vit', value: vitNum });
                }
                break;
            case 'eee':
                if (cc.game.infor.cheetSwtich) {
                    var qnum = cc.game.commonMethod.randomIntWithRange(1, 4);
                    cc.log('eee add', qnum);
                    cc.game.commonMethod.itemsChangeData(17, 1, qnum);
                }
                break;
            case '作弊码':
                cc.game.infor.cheetSwtich = true;
                var children = this.node.children;
                for (var i in children) {
                    children[i].active = true;;
                }
                break;

        }
        if (cc.game.infor.cheetSwtich) {
            if (sender.string.match('geti')) {
                var idx = sender.string.search(':');
                var idx1 = sender.string.search(',');
                var itemid = Number(sender.string.slice(idx + 1, idx1));
                var itemcount = Number(sender.string.slice(idx1 + 1));
                cc.game.commonMethod.itemsChangeData(itemid, itemcount);
            }
        } else {
            cc.game.commonMethod.addTipText({ type: 1, string: '为什么要打' + sender.string });
        }
    }

});

cc._RF.pop();
},{"dataManager":"dataManager"}],"clickdown":[function(require,module,exports){
"use strict";
cc._RF.push(module, '7ca61PpbadD+LcqRlqUcbZR', 'clickdown');
// Script/town/clickdown.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.game.addPersistRootNode(this.node);
    },

    clicked: function clicked() {
        // cc.log('播放点击特效')
        this.getComponent(cc.Animation).play('clickdown');
    }

});

cc._RF.pop();
},{}],"dataManager":[function(require,module,exports){
"use strict";
cc._RF.push(module, '1c956SP9PJCipP7h5wHZSSm', 'dataManager');
// Script/utils/dataManager.js

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var storageManager = require('storageManager');

var dataManager = function () {
    if (!cc.sys.localStorage.getItem('userID')) {
        cc.sys.localStorage.userID = 0;
        cc.sys.localStorage.setItem('useID', 0);
    }
    return {
        changeData: function changeData(data) {
            // cc.log('changeData:', typeof(cc.game.res[data.type]), typeof(data.value), data.type, data.value);
            cc.game.res[data.type] += data.value;
            //storageManager.writeData({type: data.type, value: cc.game.res[data.type]});
            cc.sys.localStorage.setItem(data.type, cc.game.res[data.type]);

            if (data.type === 'items') {
                // cc.log('changeData::items');
            }

            var node = cc.find('Canvas');
            var ref = false;
            if (node) {
                var scr = node.getComponent('town_main');
                if (scr) {
                    ref = true;
                    scr.changeDataEvent({ type: data.type, value: data.value });
                }
            }
            if (!ref) {
                cc.log('dataManager changeData false');
            }
        },

        coverData: function coverData(data) {
            // cc.log('coverData', data.type, data.value);
            cc.game.res[data.type] = data.value;
            if (_typeof(data.value) === 'object') {
                cc.sys.localStorage.setItem(data.type, JSON.stringify(data.value));
            } else {
                cc.sys.localStorage.setItem(data.type, data.value);
            }
            if (data.type === 'items') {}
            // cc.log('coverData::items');


            //storageManager.writeData(data);
        },

        // readData: function(type){
        //     //cc.game.res[type] = storageManager.readData(type);
        //     cc.game.res[type] = cc.sys.localStorage.getItem(type);
        //     return cc.game.res[type] || -99999;
        // },
        readData: function readData(type) {
            var value = JSON.parse(cc.sys.localStorage.getItem(type));
            return cc.game.res[type] = value !== null ? value : -99999;
        },

        readObjectData: function readObjectData(type) {
            cc.game.res[type] = JSON.parse(cc.sys.localStorage.getItem(type));
            return cc.game.res[type];
        }
    };
}();
module.exports = dataManager;
//{}

cc._RF.pop();
},{"storageManager":"storageManager"}],"data":[function(require,module,exports){
"use strict";
cc._RF.push(module, '4ef67qfQA1GaaWgQB5ZfhYu', 'data');
// Script/data/data.js

'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

var dataManager = require('dataManager');

var awardKind = ['gold', 'rmb', 'vit', 'recharge', 'mercEXP', 'items'];

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        //cc.game.addPersistRootNode(this.node);
        cc.game.commonMethod = this;
    },


    //随机奖励种类
    randomAwardKind: function randomAwardKind(obj) {
        var per = 0;
        var rand = Math.random();
        for (var i = 0; i < obj.length; i++) {
            per += parseFloat(obj[i].chance);
            if (rand <= per) {
                return i;
            }
        }
        cc.log('randomAwardKind cannot check award', obj);
        return 0;
    },


    //发放奖励表内所有奖励项
    grantAwards: function grantAwards(obj) {
        var item = {};
        for (var i = 0; i < awardKind.length; i++) {
            var str = awardKind[i];
            for (var j in obj) {
                if (j === str && obj[j]) {
                    if (str === 'items') {
                        for (var k in obj[j]) {
                            cc.game.commonMethod.itemsChangeData(Number(obj[j][k].id), Number(obj[j][k].count));
                        }
                    } else {
                        dataManager.changeData({ type: str, value: Number(obj[j]) });
                    }
                }
            }
        }
    },


    //检测是否已有该佣兵 num-佣兵ID
    checkIsHaveMercenary: function checkIsHaveMercenary(pId) {
        var ref = false;
        var idx = -1;
        // let n = Number(pId);
        // (Math.random() < 0.5)?(ref = true):(ref = false);
        // cc.log('checkHasMercenaty', ref);
        if (cc.game.res.mercenarys && cc.game.res.mercenarys !== -99999) {
            for (var i in cc.game.res.mercenarys) {
                if (Number(cc.game.res.mercenarys[i].id) === Number(pId)) {
                    ref = true;
                    idx = Number(i);
                    break;
                }
            }
        }
        return { ref: ref, idx: idx };
    },


    //检测是否是碎片类型 num-道具表中type类型 是碎片类型返回true
    checkIsPatch: function checkIsPatch(pId) {
        var ref = false;
        if (Number(pId) === 4 || Number(pId) === 5) {
            ref = true;
        }
        return ref;
    },


    //检测拥有道具数量 返回值0-~
    checkHaveItemCount: function checkHaveItemCount(pId) {
        // let n = parseInt(Math.random() * 100);
        // (Math.random() < 0.3)?(n = 0):(1);
        var count = 0;
        var idx = 0;
        if (cc.game.res.items && cc.game.res.items !== -99999) {
            for (var i in cc.game.res.items) {
                if (Number(cc.game.res.items[i].id) === Number(pId)) {
                    count = Number(cc.game.res.items[i].count);
                    idx = i;
                    break;
                }
            }
        }
        return { count: count, idx: idx };
    },


    //检测佣兵是否穿戴装备 并返回装备在背包内的索引
    //pIdx 佣兵在玩家信息中索引  pPart装备部位索引
    getMercEquip: function getMercEquip(pIdx, pPart) {
        var ref = -1;
        if (cc.game.res.mercenarys[pIdx]) {
            if (cc.game.res.mercenarys[pIdx].equip) {
                if (cc.game.res.mercenarys[pIdx].equip[pPart]) {
                    ref = cc.game.res.mercenarys[pIdx].equip[pPart];
                }
            }
        }
        return ref;
    },


    //穿上装备
    onEquip: function onEquip(pMercIdx, pEquipIdx, pPart) {
        cc.log('onEquip', pMercIdx, pEquipIdx, pPart);
        //检测该佣兵部位上是否已装备
        var ref = this.getMercEquip(pMercIdx, pPart);
        //有装备先卸下
        if (ref > 0) {
            this.offEquip(pMercIdx, pEquipIdx, pPart);
        }
        //穿上新装备
        cc.game.res.mercenarys[pMercIdx].equip[pPart] = pEquipIdx;
        dataManager.coverData({ type: 'mercenarys', value: cc.game.res.mercenarys });
        //新装备标记
        cc.game.res.items[pEquipIdx].hasequiped = 1;
        dataManager.coverData({ type: 'items', value: cc.game.res.items });

        return true;
    },


    //脱下装备
    offEquip: function offEquip(pMercIdx, pEquipIdx, pPart) {
        cc.log('offEquip', pMercIdx, pEquipIdx, pPart);
        var idx = cc.game.res.mercenarys[pMercIdx].equip[pPart];
        //将背包信息内该装备信息修改为未装备
        cc.game.res.items[idx].hasequiped = -1;
        dataManager.coverData({ type: 'items', value: cc.game.res.items });
        //将佣兵信息内该部位修改为无装备
        cc.game.res.mercenarys[pMercIdx].equip[pPart] = -1;
        dataManager.coverData({ type: 'mercenarys', value: cc.game.res.mercenarys });
    },


    //获得装备
    equipChangeData: function equipChangeData(pId, pCount, pQuality) {
        cc.log('equipChangeData', pId, pCount, pQuality);

        var eData = cc.game.data.items.items[pId];
        var q = this.quality222Number(pQuality);
        var newEquip = Object.assign({ 'id': pId, 'count': 1, 'finalquality': q, 'hasequiped': -1 }, eData);
        newEquip = Object.assign(newEquip, { 'quality': q });
        //装备实际属性计算
        //主属性
        var mainattrKey = null;
        var mainattrValue = null;
        var minorattr = [];
        var mainattrData = eData.mainattr[q];
        var idx = 0;
        if (mainattrData.length > 1) {
            idx = this.randomInt(mainattrData.length - 1);
        }
        mainattrKey = mainattrData[idx].type;
        mainattrValue = Math.round(this.randomIntWithRange(mainattrData[idx].min, mainattrData[idx].max) * EquipQualityRatio[q]);

        //副属性
        var minorData = [];
        if (q > 0) {
            minorData = eData.minorattr;
            var idxList = this.randomAverageDistribution(minorData.length, q);
            for (var i = 0; i < idxList.length; i++) {
                var tempKey = minorData[idxList[i]].type;
                var tempValue = Math.round(this.randomIntWithRange(minorData[idxList[i]].min, minorData[idxList[i]].max) * EquipQualityRatio[q]);
                minorattr.push({ 'attr': tempKey, 'value': tempValue });
            }
        }

        newEquip = Object.assign(newEquip, { 'finalmainattr': [{ 'attr': mainattrKey, 'value': mainattrValue }], 'finalminorattr': minorattr });

        //----------------------------------分割线-------------------------------------------------------------------
        if (cc.game.res.items && cc.game.res.items !== -99999) {
            //背包内有道具
            cc.game.res.items.push(newEquip);
            // cc.log("adddddddddddddddd", typeof(cc.game.res.items), cc.game.res.items);
            dataManager.coverData({ type: 'items', value: cc.game.res.items });
        } else {
            //背包内无道具
            var arr = new Array();
            arr.push(newEquip);
            dataManager.coverData({ type: 'items', value: arr });
            arr = null;
        }
        return true;
    },
    treasureChangeData: function treasureChangeData(pId, pCount, pQuality) {
        cc.log('treasureChangeData', pId, pCount, pQuality);
        return true;
    },


    //消耗、获得道具
    itemsChangeData: function itemsChangeData(pId, pCount, pQuality) {
        // cc.log('data : itemsChangeData');
        var ref = false;
        //安全判断
        if (typeof pId !== 'number' || pId <= 0) {
            //?? pId为0时 会出问题
            cc.log('data: itemsChangeData : 获得错误奖励', typeof pId === 'undefined' ? 'undefined' : _typeof(pId), typeof pCount === 'undefined' ? 'undefined' : _typeof(pCount), pId, pCount);
            return ref;
        }
        //装备类单独流程
        if (Number(cc.game.data.items.items[pId].type) === 6) {
            //
            ref = this.equipChangeData(pId, pCount, pQuality);
            return ref;
        }
        //宝物类单独流程
        if (Number(cc.game.data.items.items[pId].type) === 3) {
            //
            ref = this.treasureChangeData(pId, pCount, pQuality);
            return ref;
        }
        var sth = this.checkHaveItemCount(pId);
        //pCount = pCount || 1; 
        if (pCount <= 0) {
            //使用道具 道具数量减少
            if (sth.count >= pCount) {
                //道具数量足够扣除
                cc.game.res.items[sth.idx].count = Number(cc.game.res.items[sth.idx].count) + Number(pCount);
                if (cc.game.res.items[sth.idx].count === 0) {
                    //该道具用尽 删除数据
                    cc.game.res.items.splice(Number(sth.idx), 1);
                }
                dataManager.coverData({ type: 'items', value: cc.game.res.items });
                ref = true;
            }
        } else {
            //获得道具
            if (sth.count === 0) {
                //当前无此道具
                if (cc.game.res.items && cc.game.res.items !== -99999) {
                    //背包内有道具
                    var newItem = { 'id': pId, 'count': pCount };
                    cc.game.res.items.push(newItem);
                    cc.log(_typeof(cc.game.res.items));
                    dataManager.coverData({ type: 'items', value: cc.game.res.items });
                } else {
                    //背包内无道具
                    var arr = new Array();
                    var _newItem = { 'id': pId, 'count': pCount };
                    arr.push(_newItem);
                    dataManager.coverData({ type: 'items', value: arr });
                    arr = null;
                }
            } else {
                cc.game.res.items[sth.idx].count = Number(cc.game.res.items[sth.idx].count) + Number(pCount);
                dataManager.coverData({ type: 'items', value: cc.game.res.items });
            }
            ref = true;
        }
        return ref;
    },


    //获得佣兵
    gainNewMercenary: function gainNewMercenary(pId, pLv, pExp) {
        cc.log('data : gainNewMercenary', pId);
        var ref = false;
        //先检测是否已有该佣兵 无法重复获得
        var check = this.checkIsHaveMercenary(pId);
        if (!check.ref) {
            pLv = pLv || 1;
            pExp = pExp || 0;
            if (cc.game.res.mercenarys && cc.game.res.mercenarys !== -99999) {
                var newMer = { 'id': pId, 'lv': pLv, 'exp': pExp, 'state': -100, 'equip': [-1, -1, -1, -1, -1, -1, -1] };
                cc.game.res.mercenarys.push(newMer);
                cc.log(_typeof(cc.game.res.mercenarys));
                dataManager.coverData({ type: 'mercenarys', value: cc.game.res.mercenarys });
            } else {
                var arr = new Array();
                var _newMer = { 'id': pId, 'lv': pLv, 'exp': pExp, 'state': -100, 'equip': [-1, -1, -1, -1, -1, -1, -1] };
                arr.push(_newMer);
                cc.log(typeof arr === 'undefined' ? 'undefined' : _typeof(arr));
                dataManager.coverData({ type: 'mercenarys', value: arr });
                arr = null;
            }
            ref = true;
        }
        return ref;
    },


    //改变佣兵信息
    mercenaryChangeData: function mercenaryChangeData(pId, pLv, pExp) {
        // cc.log('data : mercenaryChangeData');
        var ref = false;
        pLv = pLv || 1;
        pExp = pExp || 0;
        if (cc.game.res.mercenarys && cc.game.res.mercenarys !== -99999) {
            var newMer = { 'id': pId, 'lv': pLv, 'exp': pExp, 'state': -100 }; //ID编号，等级，经验值，上阵状态（0-未上阵 1-上阵 2-助阵）
            cc.game.res.mercenarys.push(newMer);
            dataManager.coverData({ type: 'mercenarys', value: cc.game.res.mercenarys });
        } else {
            var arr = new Array();
            var _newMer2 = { 'id': pId, 'lv': pLv, 'exp': pExp, 'state': -100 };
            arr.push(_newMer2);
            dataManager.coverData({ type: 'mercenarys', value: arr });
            arr = null;
        }
        return ref;
    },


    //改变佣兵经验信息 不会掉经验 只会涨
    changeMercenaryExpData: function changeMercenaryExpData(pId, pExp) {
        // cc.log('changeMercenaryExpData', pId, pExp);
        var ref = false;
        var curLv = 0;
        var curExp = 0;
        var temp = cc.game.res.mercenarys;
        if (temp && temp !== -99999) {
            for (var i in temp) {
                if (temp[i].id === pId) {
                    ref = true;
                    // curExp = temp[i].exp;
                    // curExp += pExp;
                    var value = this.checkMercUpgrade(temp[i].exp + pExp, temp[i].lv);
                    // cc.log('value', value);
                    temp[i].exp = value.exp;
                    temp[i].lv = value.lv;
                    dataManager.coverData({ type: 'mercenarys', value: temp });
                }
            }
        }
        return ref;
    },


    //改变佣兵上阵信息
    changeMercenaryStateData: function changeMercenaryStateData(pId, pState) {
        // cc.log('changeMercenaryStateData', pId, pState);
        var ref = false;
        var temp = cc.game.res.mercenarys;
        if (temp && temp !== -99999) {
            for (var i in temp) {
                if (temp[i].id === pId) {
                    ref = true;
                    temp[i].state = pState;
                    dataManager.coverData({ type: 'mercenarys', value: temp });
                    break;
                }
            }
        }
        return ref;
    },


    //检测佣兵是否可升级 返回升级后经验值、等级
    checkMercUpgrade: function checkMercUpgrade(pExp, pLv) {
        // cc.log('checkMercUpgrade');
        for (var i in cc.game.data.mercEXP) {
            if (i >= pLv) {
                if (pExp >= Number(cc.game.data.mercEXP[i])) {
                    pExp -= Number(cc.game.data.mercEXP[i]);
                    ++pLv;
                } else if (pExp < Number(cc.game.data.mercEXP[i])) {
                    break;
                }
            }
        }
        return { exp: pExp, lv: pLv };
    },


    //checkUserLVHasUpgrade checkVIPHasUpgrade

    //data:{type: 2, string: str} type 1-操作提示 2-信息提示
    addTipText: function addTipText(data) {
        var tipLayoutSrc = cc.find('tiplayout').getComponent('tipLayout');
        if (!tipLayoutSrc) {
            cc.log('addTipText false');
            return;
        }
        tipLayoutSrc.addTipText(data);
    },


    //注册带参数的点击事件
    registerParamTouchEvent: function registerParamTouchEvent(node, target, component, handler, customEventData, tag) {

        var btn = node.getComponent(cc.Button);

        if (btn) {
            var click = new cc.Component.EventHandler();
            click.target = target;
            click.component = component;
            click.handler = handler;
            click.customEventData = customEventData;
            btn.clickEvents.push(click);
            node.tag = tag;
            //cc.log('registerParamTouchEvent', handler, node.tag, tag);
        } else {
            //节点无按钮组件
            cc.log('cannot find button component');
            btn = node.addComponent(cc.Button);
            var _click = new cc.Component.EventHandler();
            _click.target = target;
            _click.component = component;
            _click.handler = handler;
            _click.customEventData = customEventData;
            btn.clickEvents.push(_click);
            node.tag = tag;
        }
        return node;
    },


    //品质字符串转数字 
    quality222Number: function quality222Number(pStr) {
        if (typeof pStr === 'number') return pStr;
        if (pStr == 'SSR' || Number(pStr) == 4) {
            return 4;
        } else if (pStr == 'SR' || Number(pStr) == 3) {
            return 3;
        } else if (pStr == 'R' || Number(pStr) == 2) {
            return 2;
        } else if (pStr == 'N' || Number(pStr) == 1) {
            return 1;
        } else {
            return 0;
        }
    },


    //根据品质获得对应颜色信息
    quality222Color: function quality222Color(type) {
        var colorText = '';
        var color4 = null;
        type = this.quality222Number(type);
        if (type == 4) {
            colorText = '#FFAD00';
            color4 = cc.color(255, 173, 0, 255);
        } else if (type == 3) {
            colorText = '#FF00E0';
            color4 = cc.color(255, 0, 224, 255);
        } else if (type == 2) {
            colorText = '#1100D6';
            color4 = cc.color(17, 0, 214, 255);
        } else if (type == 1) {
            colorText = '#00FF70';
            color4 = cc.color(0, 255, 112, 255);
        } else {
            colorText = '#FFFFFF';
            color4 = cc.color(255, 255, 255, 255);
        }
        // cc.log('quality222Color', colorText, color4);
        return { colorText: colorText, color4: color4 };
    },


    //根据属性字符串获得对应颜色信息
    attr222Color: function attr222Color(type) {
        var colorText = '';
        var color4 = null;
        var str = '';
        if (type == 'att') {
            colorText = '#FFAD00';
            color4 = cc.color(255, 173, 0, 255);
            str = '攻击';
        } else if (type == 'def') {
            colorText = '#FF00E0';
            color4 = cc.color(255, 0, 224, 255);
            str = '防御';
        } else if (type == 'health') {
            colorText = '#1100D6';
            color4 = cc.color(17, 0, 214, 255);
            str = '生命';
        } else if (type == 'speed') {
            colorText = '#00FF70';
            color4 = cc.color(0, 255, 112, 255);
            str = '速度';
        } else {
            colorText = '#FFFFFF';
            color4 = cc.color(255, 255, 255, 255);
            str = '闪避';
        }
        // cc.log('quality222Color', colorText, color4);
        return { colorText: colorText, color4: color4, str: str };
    },


    //随机一个整数
    randomInt: function randomInt(range) {
        range = Number(range);
        return Math.round(Math.random() * range);
    },


    //在一定范围内随机一个整数
    randomIntWithRange: function randomIntWithRange(start, end) {
        start = Number(start);
        end = Number(end);
        var ref = start + Math.round((end - start) * Math.random());
        cc.log('randomIntWithRange', ref);
        return ref;
    },


    //随机一个浮点数 两位小数
    randomFloat: function randomFloat(range) {
        range = Number(range);
        return Math.round(Math.random() * range * 100) / 100;
    },


    //获得浮动区域内随机数字
    drift: function drift(target, min, max) {
        target = Number(target);
        min = Number(min);
        max = Number(max);
        return target * min + target * this.randomFloat(max - min);
    },


    //从total个数平均随机出count个 返回值从0开始 到total-1
    randomAverageDistribution: function randomAverageDistribution(total, count) {
        var per = 1 / total;
        var ref = [];

        while (ref.length < count) {
            var rand = Math.floor(Math.random() / per);
            var check = false;
            for (var i in ref) {
                if (rand === ref[i]) {
                    check = true;
                }
            }
            if (!check) {
                ref.push(rand);
            }
        }
        // cc.log('randomAverageDistribution', ref);
        return ref;
    },


    //将佣兵上阵 id佣兵ID pos位置 type类型 1为从列表中上阵 2为上阵中变换
    intoFormation: function intoFormation(type, id, pos) {
        var ref = -1;
        var idx = -1;
        //查找佣兵在全局表中存放的位置索引
        for (var i in cc.game.res.mercenarys) {
            if (Number(cc.game.res.mercenarys[i].id) === id) {
                idx = Number(i);
                ref = Number(i);
            }
        }

        //未找到佣兵直接返回失败结果 未找到佣兵
        if (ref < 0) return -1;

        var temp = dataManager.readData('formation');
        var isOnFormation = -1;
        var checkPos = -1;
        if (temp && temp.posInfor) {
            for (var i in temp.posInfor) {
                //如果佣兵已经在阵上 则改变位置信息
                if (temp.posInfor[i].idx >= 0 && temp.posInfor[i].idx === idx) {
                    temp.posInfor[i].pos = pos;
                    isOnFormation = temp.posInfor[i].idx;
                    break;
                }
            }
            // if(isOnFormation === -1){
            //     for(var i in temp.posInfor){
            //         if(temp.posInfor[i].pos >= 0 && temp.posInfor[i].pos === pos){
            //             temp.posInfor[i].idx = idx;
            //             checkPos = temp.posInfor[i].pos;
            //             break;
            //         }
            //     }
            //     if(checkPos === -1){
            //         let n = {'idx':idx, 'pos':pos};
            //         temp.posInfor.push(n);
            //     }
            // }
            // if(isOnFormation === -1 && checkPos === -1){
            //     let n = {'idx':idx, 'pos':pos};
            //     temp.posInfor.push(n);
            // }
            if (isOnFormation === -1) {
                var n = { 'idx': idx, 'pos': pos };
                temp.posInfor.push(n);
            }
        } else {
            var arr = new Array();
            var _n = { 'idx': idx, 'pos': pos };
            arr.push(_n);
            //temp.posInfor = {};
            temp.posInfor = arr;
            arr = null;
        }
        //？？检测是否超过最大上阵人数
        var count = 0;
        for (var i in temp.posInfor) {
            if (temp.posInfor[i].idx >= 0) {
                ++count;
            }
        }
        //超过上阵最大人数返回失败结果 
        if (count > temp.max) return -2;
        //清楚位置表内无用数据
        for (var i in temp.posInfor) {
            if (temp.posInfor[i].idx < 0) {
                cc.log('splice:', i, temp.posInfor.length);
                temp.posInfor.splice(i, 1);
            }
        }
        this.changeMercenaryStateData(id, pos);
        dataManager.coverData({ type: 'formation', value: temp });
    },


    //将佣兵下阵
    leaveFormation: function leaveFormation(id, pos) {
        id = Number(id);
        var ref = -1;
        var idx = -1;

        //查找佣兵在全局表中存放的位置索引
        for (var i in cc.game.res.mercenarys) {
            if (cc.game.res.mercenarys[i].id === id) {
                idx = Number(i);
                ref = Number(i);
            }
        }

        //未找到佣兵直接返回失败结果 未找到佣兵
        if (ref < 0) return -1;

        var temp = dataManager.readData('formation');
        if (temp && temp.posInfor) {
            for (var i in temp.posInfor) {
                if (temp.posInfor[i].pos >= 0 && (temp.posInfor[i].pos === pos || pos < 0) && temp.posInfor[i].idx >= 0 && temp.posInfor[i].idx === idx) {
                    temp.posInfor[i].idx = -1;
                    ref = Number(i);
                    break;
                }
            }
        }
        //阵型信息中未找到该佣兵返回失败结果 该佣兵并未上阵
        if (ref < 0) return -2;
        //检测是否全部下阵
        if (pos < 0) {
            var count = 0;
            for (var i in temp.posInfor) {
                if (temp.posInfor[i].idx >= 0) {
                    ++count;
                }
            }
            //上阵佣兵为0返回失败结果 不可全部下阵 
            if (count === 0) return -3;
        }
        //清楚位置表内无用数据
        cc.log('splice before:', temp.posInfor.length, temp.posInfor);
        for (var i in temp.posInfor) {
            if (temp.posInfor[i].idx < 0) {
                cc.log('splice:', i, temp.posInfor.length);
                temp.posInfor.splice(i, 1);
            }
        }
        cc.log('splice after:', temp.posInfor.length, temp.posInfor);
        this.changeMercenaryStateData(id, -1);
        dataManager.coverData({ type: 'formation', value: temp });
    },


    //检测佣兵上阵状态
    checkFormation: function checkFormation(pId) {
        var ref = -100;
        var idx = -1;

        //查找佣兵在全局表中存放的位置索引
        for (var i in cc.game.res.mercenarys) {
            if (cc.game.res.mercenarys[i].id === pId) {
                idx = Number(i);
                ref = Number(i);
                break;
            }
        }

        //未找到佣兵直接返回失败结果 未找到佣兵
        if (ref < 0) return -101;

        //return cc.game.res.mercenarys[idx].state || -100;
        return cc.game.res.mercenarys[idx].state >= 0 ? cc.game.res.mercenarys[idx].state : -100;
    },


    //检测某位置是否有佣兵上阵 返回值为佣兵在拥有佣兵表内索引位置
    checkFormation4Pos: function checkFormation4Pos(pIdx) {
        var ref = -1;
        var temp = cc.game.res.formation;
        if (temp && temp.posInfor) {
            for (var i in temp.posInfor) {
                if (temp.posInfor[i].pos === pIdx && temp.posInfor[i].idx >= 0) {
                    ref = temp.posInfor[i].idx;
                    break;
                }
            }
        }
        return ref;
    },


    //获得当前上阵佣兵数量
    getOnFormationCount: function getOnFormationCount() {
        var ref = 0;
        var temp = cc.game.res.formation;
        if (temp && temp.posInfor) {
            for (var i in temp.posInfor) {
                if (temp.posInfor[i].idx >= 0 && temp.posInfor[i].pos >= 0) {
                    ++ref;
                }
            }
        }
        return ref;
    },


    //发放表内所有奖励
    grantRewards: function grantRewards(obj) {
        for (var i in obj) {
            if (i !== 'items' && i !== 'mercEXP') {
                // cc.log('grantRewards', i, obj[i]);
                dataManager.changeData({ type: i, value: obj[i] });
            } else {
                if (i === 'items') {
                    for (var j in obj[i]) {
                        // cc.log('grantRewards item', obj[i][j].id, obj[i][j].value);
                        this.itemsChangeData(obj[i][j].id, obj[i][j].value);
                    }
                } else if (i === 'mercEXP') {
                    //为当前上阵佣兵增加经验
                    for (j in cc.game.res.mercenarys) {
                        if (cc.game.res.mercenarys[j].state > 0) {
                            this.changeMercenaryExpData(cc.game.res.mercenarys[j].id, obj[i]);
                        }
                    }
                }
            }
        }
    },


    //数据统计 将data添加到obj
    dataStatistics: function dataStatistics(obj, data) {
        if (data.type === 'items') {
            if (!obj[data.type]) {
                obj[data.type] = [];
                obj[data.type].push({ id: data.id, value: data.value });
            } else {
                var ref = false;
                for (var i in obj[data.type]) {
                    if (obj[data.type][i].id === data.id) {
                        obj[data.type][i].value += data.value;
                        ref = true;
                        break;
                    }
                }
                if (!ref) {
                    obj[data.type].push({ id: data.id, value: data.value });
                }
            }
        } else {
            if (obj[data.type]) {
                obj[data.type] += data.value;
            } else {
                obj[data.type] = data.value;
            }
        }
        return obj;
    },


    //---------------------分割线---------属性统计-----------------------
    //统计佣兵战斗属性
    //pMercIdx 佣兵在玩家信息中索引
    censusMercAllAttr: function censusMercAllAttr(pMercIdx) {
        var selfAttr = this.censusMercSelfAttr(pMercIdx);
        var equipAttr = this.censusMercEquipAttr(pMercIdx);

        var finalAttr = {};
        for (var i in AttrViewTab) {
            var key = AttrViewTab[i];
            var selfValue = selfAttr[key] ? Number(selfAttr[key]) : 0;
            var equipValue = equipAttr[key] ? Number(equipAttr[key]) : 0;
            var fvalue = selfValue + equipValue;
            finalAttr = Object.defineProperty(finalAttr, key, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: fvalue
            });
        }
        cc.log('censusMercAllAttr', finalAttr);

        var temp = cc.game.res.mercenarys;
        Object.defineProperty(temp[pMercIdx], 'finalattr', {
            enumerable: true,
            configurable: true,
            writable: true,
            value: finalAttr
        });

        dataManager.coverData({ type: 'mercenarys', value: temp });
    },


    //统计佣兵自身战斗属性
    censusMercSelfAttr: function censusMercSelfAttr(pMercIdx) {
        var id = cc.game.res.mercenarys[pMercIdx].id;
        var lv = cc.game.res.mercenarys[pMercIdx].lv;
        var temp = {};
        for (var i in AttrViewTab) {
            var attrKey = AttrViewTab[i];
            var attrValue = cc.game.data.mercenary.mercenary[id][attrKey] + cc.game.data.mercenary.mercenary[id][attrKey + 'inc'] * lv;
            // let obj = { attrKey : attrValue};
            // temp = Object.assign(temp, obj);
            temp = Object.defineProperty(temp, attrKey, {
                enumerable: true,
                configurable: true,
                writable: true,
                value: attrValue
            });
        }
        cc.log('censusMercSelfAttr', pMercIdx, temp);
        return temp;
    },


    //统计佣兵装备战斗属性
    censusMercEquipAttr: function censusMercEquipAttr(pMercIdx) {
        var id = cc.game.res.mercenarys[pMercIdx].id;
        var temp = {};
        for (var i in cc.game.res.mercenarys[pMercIdx].equip) {
            if (cc.game.res.mercenarys[pMercIdx].equip[i] > 0) {
                //有装备
                var itemIdx = cc.game.res.mercenarys[pMercIdx].equip[i];
                var quality = cc.game.res.items[itemIdx].finalquality;
                //主属性
                var tMain = cc.game.res.items[itemIdx].finalmainattr;
                for (var j in tMain) {
                    var attrKey = tMain[j].attr;
                    var attrValue = Number(tMain[j].value);
                    var tValue = temp[attrKey];
                    if (tValue) {
                        attrValue += Number(tValue);
                    }
                    temp = Object.defineProperty(temp, attrKey, {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: attrValue
                    });
                }
                //副属性
                var tMinor = cc.game.res.items[itemIdx].finalminorattr;
                for (var j in tMinor) {
                    var attrKey = tMinor[j].attr;
                    var attrValue = Number(tMinor[j].value);
                    var tValue = temp[attrKey];
                    if (tValue) {
                        attrValue += Number(tValue);
                    }
                    temp = Object.defineProperty(temp, attrKey, {
                        enumerable: true,
                        configurable: true,
                        writable: true,
                        value: attrValue
                    });
                }
            }
        }

        cc.log('censusMercEquipAttr', pMercIdx, temp);
        return temp;
    }
});

cc._RF.pop();
},{"dataManager":"dataManager"}],"define":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'e7a474BIsBBiLlyFp4fOPZR', 'define');
// Script/utils/define.js

'use strict';

window.AttrViewTab = ['att', 'def', 'health', 'speed']; //属性表
window.WildAwardKind = ['gold', 'rmb', 'vit', 'recharge', 'userEXP', 'mercEXP', 'items']; //野外奖励类型
window.ItemKindIntro = ['', 'ALL', '4', '5', '1', '2', '3', '6']; //道具类型 1材料2消耗3宝物4佣兵5英雄6装备
window.EquipQualityRatio = [1, 1.1, 1.225, 1.4]; //装备品质提升系数
window.EquipPartNumber = 6; //装备部位最大数量
window.EquipPartText = ['', '武器', '衣服', '腰带', '头盔', '项链', '靴子']; //装备部位描述文本  1武器2衣服3腰带4头5项链6鞋子
window.ItemShowAllSwitch = false; //背包显示所有道具开关（false时不显示已装备的装备或宝物）

//{}
//---------------------分割线--------------------------------

cc._RF.pop();
},{}],"dialog":[function(require,module,exports){
"use strict";
cc._RF.push(module, '0c8cfQVPoNO9oeqwwJJUp0G', 'dialog');
// Script/login/dialog.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.node.getComponent(cc.Label).string = '3秒后开始对话';
        this.dialogs = [];
        this.currentDialog = '';
        this.currentText = '';
        this.loadRef = false;
        this.length = 0;
    },

    start: function start() {
        this.scheduleOnce(this.showDialog, 3);
    },
    showDialog: function showDialog() {

        this.unschedule(this.showDialog);

        //加载对话配置信息 仅一次
        if (!this.loadRef) {
            for (var i in cc.game.data.dialogs.dialogs) {
                this.dialogs.push(cc.game.data.dialogs.dialogs[i]);
            }
            this.loadRef = true;
        }

        if (this.currentDialog == this.currentText) {
            if (this.dialogs.length > 0) {
                this.currentDialog = this.dialogs.shift();
                this.length = 0;
            } else {
                this.schedule(this.closeDialog, 1);
                return;
            }
        }

        if (this.currentDialog.includes('/n')) {
            //立即显示
            this.currentText = this.currentDialog;
            this.node.getComponent(cc.Label).string = this.currentText;
            this.schedule(this.showDialog, 1.3);
        } else {
            //逐字显示
            ++this.length;
            this.currentText = this.currentDialog.substring(0, this.length);
            this.node.getComponent(cc.Label).string = this.currentText;
            if (this.currentDialog == this.currentText) {
                this.schedule(this.showDialog, 0.2, null, 1.3);
            } else {
                this.schedule(this.showDialog, 0.2);
            }
        }
    },
    closeDialog: function closeDialog() {
        cc.log('closeDialog');
        this.unschedule(this.closeDialog);
        this.node.getComponent(cc.Label).string = '对话结束';
    }
});

cc._RF.pop();
},{}],"equipjs":[function(require,module,exports){
"use strict";
cc._RF.push(module, '7744ba1dbZI1pcn/pI/7J9l', 'equipjs');
// Script/utils/equipjs.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        prefabEquipView: cc.Prefab
    },

    // use this for initialization
    onLoad: function onLoad() {},

    init: function init(pIdx) {
        pIdx = Number(pIdx);
        var id = cc.game.res.items[pIdx].id;
        var data = cc.game.res.items[pIdx];
        cc.log('equipjs_init:', pIdx, id);
        this.view = cc.instantiate(this.prefabEquipView);
        //名称
        this.view.getChildByName('name').getComponent(cc.RichText).string = '<color=' + cc.game.commonMethod.quality222Color(data.finalquality).colorText + '>' + data.name + '</c>';

        //Icon
        this.view.getChildByName('equip').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(data.icon);
        this.view.getChildByName('equip').getChildByName('frame').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame('itemframe' + data.finalquality);

        //类型
        this.view.getChildByName('type').getChildByName('text').getComponent(cc.Label).string = EquipPartText[data.part];

        //需求等级
        this.view.getChildByName('needlv').getChildByName('text').getComponent(cc.Label).string = data.needlv;

        //主属性
        var main = this.view.getChildByName('main').getChildByName('maintab');
        var mainLength = 0;
        var lineHeight = 0;
        for (var i = 0; i < main.childrenCount; i++) {
            var nn = '' + i;
            if (i < data.finalmainattr.length) {
                var attr = data.finalmainattr[i].attr;
                var value = data.finalmainattr[i].value;
                var infor = cc.game.commonMethod.attr222Color(attr);
                main.getChildByName(nn).color = infor.color4;
                var str = '' + infor.str + ': ' + value;
                main.getChildByName(nn).getComponent(cc.Label).string = str;
                ++mainLength;
                lineHeight = lineHeight > 0 ? lineHeight : main.getChildByName(nn).getComponent(cc.Label).lineHeight;
            } else {
                main.getChildByName(nn).active = false;
            }
        }
        //副属性
        var yOff = (4 - mainLength) * lineHeight;
        var minor = this.view.getChildByName('minor').getChildByName('minortab');
        var minorLength = 0;
        var pos = minor.getPosition();
        minor.setPosition(pos.x, pos.y + yOff);
        for (var i = 0; i < minor.childrenCount; i++) {
            var nn = '' + i;
            if (i < data.finalminorattr.length) {
                var attr = data.finalminorattr[i].attr;
                var value = data.finalminorattr[i].value;
                var infor = cc.game.commonMethod.attr222Color(attr);
                minor.getChildByName(nn).color = infor.color4;
                var str = '' + infor.str + ': ' + value;
                minor.getChildByName(nn).getComponent(cc.Label).string = str;
                ++minorLength;
            } else {
                minor.getChildByName(nn).active = false;
            }
        }

        this.view.getChildByName('close').on(cc.Node.EventType.TOUCH_END, this.closeView, this);
        return this.view;
    },
    closeView: function closeView() {
        this.view.removeFromParent(true);
    }
});

cc._RF.pop();
},{}],"gototown":[function(require,module,exports){
"use strict";
cc._RF.push(module, '7e786oLECpCILDIn5nEs1wn', 'gototown');
// Script/wild/gototown.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {},

    gotoTown: function gotoTown() {
        cc.audioEngine.stopAll();
        cc.director.loadScene('town');

        //将野外场景中常驻节点隐藏
        var node = cc.find('wildroot');
        node.opacity = 0;
    }
});

cc._RF.pop();
},{}],"gotowild":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'c33d3djJg5DVIoZmqqs0jN6', 'gotowild');
// Script/town/gotowild.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {},

    gotoWild: function gotoWild() {
        cc.audioEngine.stopAll();
        cc.director.loadScene('wild');

        // //将城镇场景中常驻节点隐藏
        // var node = cc.find('Canvas');
        // node.opacity = 0;
    }

});

cc._RF.pop();
},{}],"loadXML":[function(require,module,exports){
"use strict";
cc._RF.push(module, '495eee90iNPjoxnRdplhm1p', 'loadXML');
// Script/utils/loadXML.js

"use strict";

var loadXML = function () {
    return {
        loadXMLFile: function loadXMLFile(xmlFile) {
            var xmlDoc = '';
            if (window.ActiveXObject) {
                // IE     
                var activeXNameList = new Array("MSXML2.DOMDocument.6.0", "MSXML2.DOMDocument.5.0", "MSXML2.DOMDocument.4.0", "MSXML2.DOMDocument.3.0", "MSXML2.DOMDocument", "Microsoft.XMLDOM", "MSXML.DOMDocument");
                for (var h = 0; h < activeXNameList.length; h++) {
                    try {
                        xmlDoc = new ActiveXObject(activeXNameList[h]);
                    } catch (e) {
                        continue;
                    }
                    if (xmlDoc) break;
                }
            } else if (document.implementation && document.implementation.createDocument) {
                //非 IE  
                xmlDoc = document.implementation.createDocument("", "", null);
            } else {
                alert('can not create XML DOM object, update your browser please...');
            }

            if (xmlDoc != null) {
                xmlDoc.async = false;
                xmlDoc.load(xmlFile);
            }
            return xmlDoc;
        }
    };
}();
module.exports = loadXML;

cc._RF.pop();
},{}],"login":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'e9304LOVGBObYfBisTQNx4a', 'login');
// Script/login/login.js

'use strict';

var storageManager = require('storageManager');
var dataManager = require('dataManager');
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        idLabel: cc.Label,
        idEditBox: cc.EditBox,
        newLayer: cc.Node,
        oldLayer: cc.Node,
        newComerGold: 0,
        newComerRmb: 0,
        newComerVit: 0

    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.game.res = {};
        cc.game.data = {};
        cc.game.infor = {};
        cc.game.spriteCache = {};

        cc.game.infor.calcedOffRewards = false;
        cc.game.infor.test = true;

        //提前加载XML配置
        this.preLoadJSON();

        //提前加载ICON
        this.preLoadIcon();

        cc.director.preloadScene('town');

        var id = Number(storageManager.readData('userID'));
        //cc.log('onLoad()', id);
        if (id && id !== -99999 && id !== 0) {
            cc.log('onLoad()', 'old');
            cc.game.res.nickName = storageManager.readData('nickName');
            this.idLabel.string = cc.game.res.nickName;
            //重置数据
            //storageManager.writeData({type: 'userID', value: '-99999'});
        } else {
            cc.log('onLoad()', 'new');
            this.newComerSetting();
            this.oldLayer.active = false;
            this.newLayer.active = true;
        }

        cc.director.preloadScene('town');
    },

    onDestroy: function onDestroy() {
        cc.log('onDestroy');
    },

    //新玩家初始信息
    newComerSetting: function newComerSetting() {
        //cc.log('newComerSetting', this.newComerGold);
        var defaultObj = [];
        var arry = new Array();
        dataManager.coverData({ type: 'gold', value: this.newComerGold });
        dataManager.coverData({ type: 'rmb', value: this.newComerRmb });
        dataManager.coverData({ type: 'vit', value: this.newComerVit });
        dataManager.coverData({ type: 'vipLV', value: 0 });
        dataManager.coverData({ type: 'recharge', value: 0 }); //累积充值
        dataManager.coverData({ type: 'userLV', value: 1 }); //玩家等级
        dataManager.coverData({ type: 'userEXP', value: 0 }); //玩家经验
        dataManager.coverData({ type: 'formation', value: { type: 0, lv: 1, max: 10 } }); //阵型
        // dataManager.coverData({type: 'mercenarys', value: arry});     //拥有佣兵
        // dataManager.coverData({type: 'items', value: arry});          //拥有道具

        // storageManager.writeData({type: 'gold', value: this.newComerGold});
        // storageManager.writeData({type: 'rmb', value: this.newComerRmb});
        // storageManager.writeData({type: 'vit', value: this.newComerVit});

        //初始一个佣兵
        cc.game.commonMethod.gainNewMercenary(9, 1, 0);
        //将其上阵4位置
        cc.game.commonMethod.intoFormation(1, 9, 4);
    },

    preLoadJSON: function preLoadJSON() {
        //累积充值
        cc.loader.loadRes('data/recharge', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.recharge = data;
            }
        });
        //玩家升级经验
        cc.loader.loadRes('data/userEXP', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.userEXP = data;
            }
        });
        //佣兵升级经验
        cc.loader.loadRes('data/mercEXP', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.mercEXP = data;
            }
        });
        //野外随机事件奖励
        cc.loader.loadRes('data/wildaward', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.wildaward = data;
            }
        });
        //佣兵
        cc.loader.loadRes('data/mercenary', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.mercenary = data;
            }
        });
        //道具
        cc.loader.loadRes('data/items', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.items = data;
            }
        });
        //召唤奖励
        cc.loader.loadRes('data/summonawards', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.summonawards = data;
            }
        });
        //加载对话配置文件
        cc.loader.loadRes('data/dialogs', function (err, data) {
            if (err) {
                cc.log(err);
            } else {
                cc.game.data.dialogs = data;
            }
        });
    },

    preLoadIcon: function preLoadIcon() {
        //佣兵头像
        cc.loader.loadRes('ui/armyicon/armyicon', cc.SpriteAtlas, function (err, atlas) {
            //cc.log('preLoadIcon-loadRes', atlas);
            cc.game.spriteCache.armyicon = atlas;
        });

        //道具
        cc.loader.loadRes('icon/items', cc.SpriteAtlas, function (err, atlas) {
            //cc.log('preLoadIcon-loadRes', atlas);
            cc.game.spriteCache.items = atlas;
        });

        //道具品质框
        cc.loader.loadRes('ui/itemframe', cc.SpriteAtlas, function (err, atlas) {
            //cc.log('preLoadIcon-loadRes', atlas);
            cc.game.spriteCache.itemframe = atlas;
        });
        //UI
        cc.loader.loadRes('ui/uigroup', cc.SpriteAtlas, function (err, atlas) {
            //cc.log('preLoadIcon-loadRes', atlas);
            cc.game.spriteCache.uigroup = atlas;
        });
    }

});

cc._RF.pop();
},{"dataManager":"dataManager","storageManager":"storageManager"}],"longin_data":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'de06eKJkp1G27WnO6oOZHKZ', 'longin_data');
// Script/login/longin_data.js

"use strict";

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.game.addPersistRootNode(this.node);
    }

});

cc._RF.pop();
},{}],"oporateBtn":[function(require,module,exports){
"use strict";
cc._RF.push(module, '01b1dwjCQtH6L3KkQEQHfkb', 'oporateBtn');
// Script/town/oporateBtn.js

'use strict';

var dataManager = require('dataManager');
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        packageUI: cc.Node,
        packageMaxKind: 0, //背包界面分类标签总数     
        prefabItem: cc.Prefab,
        prefabSeletor: cc.Prefab
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.initPackageUI();
    },

    initPackageUI: function initPackageUI() {
        this.packageBtn = this.node.getChildByName('package');
        this.packageBtn.on(cc.Node.EventType.TOUCH_END, this.packageUIManager.bind(this));

        var packageCloseBtn = this.packageUI.getChildByName('closebtn');
        packageCloseBtn.on(cc.Node.EventType.TOUCH_END, this.packageUIManager.bind(this));

        //分类标签注册响应事件 参数为种类
        var classfield = this.packageUI.getChildByName('classfield');
        for (var i = 1; i <= this.packageMaxKind; i++) {
            var node = classfield.getChildByName('tag' + i);
            var btn = node.getComponent(cc.Button);
            var click = new cc.Component.EventHandler();
            click.target = this.node;
            click.component = 'oporateBtn';
            click.handler = 'showItemsgroup';
            click.customEventData = i;
            btn.clickEvents.push(click);
            node.tag = i;
        }

        //详细信息框内按钮事件
        var btngroup = this.packageUI.getChildByName('information').getChildByName('btngroup');
        btngroup.getChildByName('source').on(cc.Node.EventType.TOUCH_END, this.showItemSourceUI.bind(this));
        btngroup.getChildByName('use').on(cc.Node.EventType.TOUCH_END, this.showUseItemUI.bind(this));

        //来源面板关闭按钮
        var sourceclosebtn = this.packageUI.getChildByName('source').getChildByName('closebtn');
        sourceclosebtn.on(cc.Node.EventType.TOUCH_END, this.closeItemSourceUI.bind(this));

        //使用道具面板关闭按钮
        var useclosebtn = this.packageUI.getChildByName('use').getChildByName('closebtn');
        useclosebtn.on(cc.Node.EventType.TOUCH_END, this.closeUseItemUI.bind(this));

        //使用道具面板使用按钮
        var useusebtn = this.packageUI.getChildByName('use').getChildByName('usebtn');
        useusebtn.on(cc.Node.EventType.TOUCH_END, this.useItem.bind(this));

        this.packageShowKindFlag = 1; //显示类型标签:1-全部 2-佣兵 3-英雄 4-材料 5-消耗 6-宝物
        this.curSelect = 0; //当前选中初始化为0
        this.itemsShowList = {}; //当前显示道具组
        this.curSelectorSprite = null; //当前选中精灵
        this.curSelectCheckCount = 0; //当前选中道具使用道具选择数量
    },

    packageUIManager: function packageUIManager() {
        if (this.packageUI.active) {
            this.packageUI.active = false;
            this.packageUI.getChildByName('itemsScrollView').getChildByName('view').getChildByName('content').removeAllChildren();
            this.removeSelector();
        } else {
            this.packageUI.active = true;
            this.showItemsgroup();
        }
    },

    showItemsgroup: function showItemsgroup(event, customEventData) {
        //cc.log('showItemsgroup', customEventData);
        var self = this;

        //并非点击标签按钮 无参数 默认显示上次关闭时的类型状态
        if (!customEventData) {
            cc.log('showItemsgroup打开背包界面');
            customEventData = self.packageShowKindFlag;
        } else if (customEventData === self.packageShowKindFlag) {
            cc.log('showItemsgroup闲的一比 瞎点啥');
            //self.createSelector();
            return;
        } else {
            cc.log('showItemsgroup切换道具显示类型', customEventData);
            //记录当前显示类型 1-全部 2-佣兵 3-英雄 4-材料 5-消耗 6-宝物
            self.packageShowKindFlag = customEventData;
            //切换显示类型 将选中默认为0
            self.curSelect = 0;
        }
        //先清除
        self.packageUI.getChildByName('itemsScrollView').getChildByName('view').getChildByName('content').removeAllChildren();

        //判断是否有道具
        if (cc.game.res.items && cc.game.res.items !== -99999) {
            var jsonData = cc.game.data.items;
            var inforNode = self.packageUI.getChildByName('information');
            self.itemsShowList = {};
            var length = 0;
            for (var i in cc.game.res.items) {
                var itemdata = jsonData.items[cc.game.res.items[i].id]; //根据ID找配置信息 索引从零开始 错位减1 !!!已修复
                if (self.checkKind(itemdata.type, customEventData) && self.checkNeedShow(i)) {
                    ++length;

                    self.itemsShowList[length] = cc.instantiate(self.prefabItem);

                    self.itemsShowList[length].id = Number(itemdata.id);
                    self.itemsShowList[length].name = itemdata.name;
                    self.itemsShowList[length].icon = itemdata.icon;
                    self.itemsShowList[length].quality = itemdata.quality;
                    self.itemsShowList[length].describe1 = itemdata.describe1;
                    self.itemsShowList[length].describe2 = itemdata.describe2;
                    self.itemsShowList[length].type = Number(itemdata.type);
                    self.itemsShowList[length].sourcetext = itemdata.sourcetext;
                    self.itemsShowList[length].rewardtype = itemdata.rewardtype;
                    self.itemsShowList[length].rewardnumber = Number(itemdata.rewardnumber);
                    self.itemsShowList[length].count = Number(cc.game.res.items[i].count);
                    self.itemsShowList[length].compose = Number(itemdata.compose);
                    self.itemsShowList[length].finalquality = Number(cc.game.res.items[i].finalquality);

                    //更换ICON贴图
                    self.itemsShowList[length].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(itemdata.icon);

                    //更换背景框贴图 ??
                    var urlstr = '';
                    if (Number(itemdata.type) === 3 || Number(itemdata.type) === 6) {
                        urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(cc.game.res.items[i].finalquality);
                    } else {
                        urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(itemdata.quality);
                    }
                    self.itemsShowList[length].getChildByName('frame').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);
                    //如果是碎片需要显示碎片标志
                    if (cc.game.commonMethod.checkIsPatch(itemdata.type)) {
                        self.itemsShowList[length].getChildByName('patch').active = true;
                    } else {
                        self.itemsShowList[length].getChildByName('patch').active = false;
                    }

                    //道具数量
                    //装备、宝物类道具不需要显示数量
                    if (self.itemsShowList[length].type === 5 || self.itemsShowList[length].type === 6) {
                        self.itemsShowList[length].getChildByName('number').active = false;
                    } else {
                        self.itemsShowList[length].getChildByName('number').getComponent(cc.Label).string = cc.game.res.items[i].count;
                    }

                    //注册按钮事件
                    self.initItemsShowListBtnEvent(self.itemsShowList[length], length, self.node);

                    self.packageUI.getChildByName('itemsScrollView').getChildByName('view').getChildByName('content').addChild(self.itemsShowList[length]);
                }
            }

            if (length === 0) {
                //当前道具列表内为空 则不显示道具详细信息 并删除当前选中框
                cc.log('showItemsgroup: current items is empty');
                self.removeSelector();
            } else {
                //显示当前选中道具详细信息
                self.showSelectItemInformation();
            }
        }
    },

    initItemsShowListBtnEvent: function initItemsShowListBtnEvent(node, num, uiNode) {
        //cc.log('initItemsShowListBtnEvent',num);
        var btn = node.getComponent(cc.Button);
        var click = new cc.Component.EventHandler();
        click.target = uiNode;
        click.component = 'oporateBtn';
        click.handler = 'showSelectItemInformation';
        click.customEventData = num;
        btn.clickEvents.push(click);
        node.tag = num;
    },

    createSelector: function createSelector() {
        //cc.log('createSelector');
        this.removeSelector();
        this.curSelectorSprite = cc.instantiate(this.prefabSeletor);
        this.itemsShowList[this.curSelect].addChild(this.curSelectorSprite);
        this.curSelectorSprite.setPosition(0, 0);
    },

    removeSelector: function removeSelector() {
        if (cc.isValid(this.curSelectorSprite)) {
            this.curSelectorSprite.destroy();
            this.curSelectorSprite = null;
        }
    },

    //显示道具详细信息
    showSelectItemInformation: function showSelectItemInformation(event, customEventData) {
        //cc.log('showSelectItemInformation', customEventData);
        var self = this;
        var inforNode = self.packageUI.getChildByName('information');

        //显示选中精灵
        if (customEventData) {
            if (customEventData !== self.curSelect) {
                self.curSelect = customEventData;
                self.createSelector();
            } else {
                cc.log('showSelectItemInformation闲的一比 瞎点啥');
                return;
            }
        } else {
            self.curSelect === 0 ? self.curSelect = 1 : 1;
            self.createSelector();
        }

        //道具名称
        inforNode.getChildByName('name').getComponent(cc.Label).string = self.itemsShowList[self.curSelect].name;
        //道具ICON框  ??
        var urlstr = '';
        if (Number(self.itemsShowList[self.curSelect].type) === 3 || Number(self.itemsShowList[self.curSelect].type) === 6) {
            urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(self.itemsShowList[self.curSelect].finalquality);
        } else {
            urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(self.itemsShowList[self.curSelect].quality);
        }
        inforNode.getChildByName('iconbg').getChildByName('itemframe').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);
        //道具ICON
        inforNode.getChildByName('iconbg').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(self.itemsShowList[self.curSelect].icon);
        //描述
        var str = '';
        var check = cc.game.commonMethod.checkIsHaveMercenary(self.itemsShowList[self.curSelect].compose);
        if (self.itemsShowList[self.curSelect].type == '4' && !check.ref) {
            str = self.itemsShowList[self.curSelect].describe2;
        } else {
            str = self.itemsShowList[self.curSelect].describe1;
        }
        inforNode.getChildByName('textbg').getChildByName('text').getComponent(cc.Label).string = str;
        //按钮注册事件
        var btngroup = inforNode.getChildByName('btngroup');
        //如果选中道具类型为消耗 需要显示使用按钮
        btngroup.getChildByName('source').active = true;
        if (self.itemsShowList[self.curSelect].type == '2') {
            btngroup.getChildByName('use').active = true;
        } else {
            btngroup.getChildByName('use').active = false;
        }
    },

    showItemSourceUI: function showItemSourceUI() {
        //cc.log('showItemSourceUI:');
        var self = this;
        var source = self.packageUI.getChildByName('source');
        source.active = true;

        //道具名称
        source.getChildByName('name').getComponent(cc.Label).string = self.itemsShowList[self.curSelect].name;
        //道具ICON框  ??
        var urlstr = '';
        if (Number(self.itemsShowList[self.curSelect].type) === 3 || Number(self.itemsShowList[self.curSelect].type) === 6) {
            urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(self.itemsShowList[self.curSelect].finalquality);
        } else {
            urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(self.itemsShowList[self.curSelect].quality);
        }
        source.getChildByName('iconbg').getChildByName('itemframe').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);
        //道具ICON
        source.getChildByName('iconbg').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(self.itemsShowList[self.curSelect].icon);
        //来源描述文本
        source.getChildByName('text').getComponent(cc.Label).string = self.itemsShowList[self.curSelect].sourcetext;
    },

    showUseItemUI: function showUseItemUI() {
        //cc.log('showUseItemUI:');

        var self = this;
        var use = self.packageUI.getChildByName('use');
        use.active = true;

        //默认为当前选中道具最大数量
        this.curSelectCheckCount = Number(self.itemsShowList[self.curSelect].count);

        //道具名称
        use.getChildByName('name').getComponent(cc.Label).string = self.itemsShowList[self.curSelect].name;
        //道具ICON框  ??
        var urlstr = '';
        if (Number(self.itemsShowList[self.curSelect].type) === 3 || Number(self.itemsShowList[self.curSelect].type) === 6) {
            urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(self.itemsShowList[self.curSelect].finalquality);
        } else {
            urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(self.itemsShowList[self.curSelect].quality);
        }
        use.getChildByName('iconbg').getChildByName('itemframe').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);
        //道具ICON
        use.getChildByName('iconbg').getChildByName('icon').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(self.itemsShowList[self.curSelect].icon);
        //选择数量文本
        use.getChildByName('checktext').getComponent(cc.Label).string = '选择数量：' + this.curSelectCheckCount;
        //滑动器默认最大值
        use.getChildByName('numberslider').getComponent(cc.Slider).progress = 1;
    },

    closeItemSourceUI: function closeItemSourceUI() {
        //cc.log('closeItemSourceUI:');
        this.packageUI.getChildByName('source').active = false;
    },

    closeUseItemUI: function closeUseItemUI() {
        //cc.log('closeUseItemUI:');
        this.packageUI.getChildByName('use').active = false;
    },

    onSliderEvent: function onSliderEvent(sender, EventType) {
        this.updateCheckNumber(sender.progress);
    },

    updateCheckNumber: function updateCheckNumber(progress) {
        var maxN = Number(this.itemsShowList[this.curSelect].count);
        this.curSelectCheckCount = parseInt(progress * maxN);
        //刷新选择数量文本
        this.packageUI.getChildByName('use').getChildByName('checktext').getComponent(cc.Label).string = '选择数量：' + this.curSelectCheckCount;
    },

    useItem: function useItem() {
        cc.log('useItem');
        //获得奖励
        var id = Number(this.itemsShowList[this.curSelect].id);
        var type = this.itemsShowList[this.curSelect].rewardtype;
        var number = Number(this.itemsShowList[this.curSelect].rewardnumber);
        var maxN = Number(this.itemsShowList[this.curSelect].count);
        number *= this.curSelectCheckCount;
        dataManager.changeData({ type: type, value: number });
        //扣除道具
        cc.game.commonMethod.itemsChangeData(id, -this.curSelectCheckCount);

        if (Number(this.itemsShowList[this.curSelect].count) === 0) {
            cc.log('道具用尽');
        }

        this.closeUseItemUI();
        this.showItemsgroup();
    },

    checkKind: function checkKind(str, type) {
        //cc.log('checkKind', typeof(str), str, typeof(type), ItemKindIntro[type]);
        //let n = Number(str);
        if (ItemKindIntro[type] === 'ALL' || str === ItemKindIntro[type]) {
            return true;
        }
        return false;
    },

    checkNeedShow: function checkNeedShow(pItemIdx) {
        if (!ItemShowAllSwitch) {
            var id = cc.game.res.items[pItemIdx].id;
            var type = Number(cc.game.data.items.items[id].type);
            if (type === 5 || type === 6) {
                if (Number(cc.game.res.items[pItemIdx].hasequiped) > 0) {
                    return false;
                }
            }
        }
        return true;
    }
});

cc._RF.pop();
},{"dataManager":"dataManager"}],"recordTime":[function(require,module,exports){
"use strict";
cc._RF.push(module, '92d36lcFPNEEJJZFOpI30Yb', 'recordTime');
// Script/utils/recordTime.js

'use strict';

var dataManger = require('dataManager');
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.game.addPersistRootNode(this.node);
        //this.recordTime();
        this.schedule(this.recordTime, 10);
    },

    recordTime: function recordTime() {
        var curTime = Date.now();
        dataManger.coverData({ type: 'lastLoginTime', value: curTime });
    }

});

cc._RF.pop();
},{"dataManager":"dataManager"}],"storageManager":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'fe9d2lCQ59HhLKjnG8dHjbL', 'storageManager');
// Script/utils/storageManager.js

"use strict";

var storageManager = function () {
    if (!cc.sys.localStorage.userID) {
        cc.sys.localStorage.userID = 0;
    }
    return {
        readData: function readData(type) {
            return cc.sys.localStorage.getItem(type) || -99999;
        },
        writeData: function writeData(data) {
            //cc.sys.localStorage[data.type] = data.value;
            cc.sys.localStorage.setItem(data.type, data.value);
        },
        readObjectData: function readObjectData(type) {
            return JSON.parse(cc.sys.localStorage.getItem(type)) || -99999;
        },
        writeObjectData: function writeObjectData(data) {
            //cc.sys.localStorage[data.type] = data.value;
            cc.sys.localStorage.setItem(data.type, JSON.stringify(data.value));
        }
    };
}();
module.exports = storageManager;
//{}

cc._RF.pop();
},{}],"tipLayout":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'b037cF97RpP0YQLaD4OSZ4i', 'tipLayout');
// Script/login/tipLayout.js

'use strict';

var tipLayout = cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        maxCount: 0

    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.log('tipLayout_onLoad');

        cc.game.addPersistRootNode(this.node);
        cc.game.tipLayout = this;

        for (var i = 0; i < this.maxCount; i++) {
            this.node.getChildByName('tiptext' + i).scale = 2;
            this.node.getChildByName('tiptext' + i).tag = i;
            //this.node.getChildByName('tiptext'+i).pauseSystemEvents(true);
        }
        // this.node.pauseSystemEvents(true);            //1.5.0才可使用
        this.node.pauseSystemEvents(true);

        // this.node.on(cc.Node.EventType.TOUCH_END, this.clicklayout);
        // for(var i = 0; i < this.maxCount; i++){
        //     let textNode = this.node.getChildByName('tiptext'+i);
        //     textNode.on(cc.Node.EventType.TOUCH_END, this.clicksth, this);
        // }
    },

    // clicklayout(event){
    //     cc.log('tiplayout_mousedown');
    // },

    // clicksth(event){
    //     cc.log('tiptext:：：：：', event.target.tag);
    // },

    checkTipTextFree: function checkTipTextFree() {
        var haveStr = -1;
        for (var i = 0; i < this.maxCount; i++) {
            var node = this.node.getChildByName('tiptext' + i);
            var str = node.getComponent(cc.RichText).string;
            if (str !== '') {
                haveStr = i;
            }
        }
        return haveStr;
    },

    addTipText: function addTipText(data) {

        //cc.log('addTipString:', data.type);
        if (data.type === 1) {
            //当提示为操作提示
            //找到最新一条提示
            var num = 0;
            for (var i = 0; i < this.maxCount; i++) {
                var node = this.node.getChildByName('tiptext' + i);
                var str = node.getComponent(cc.RichText).string;
                if (str !== '') {
                    if (str !== data.string) {
                        num = i + 1;
                    } else {
                        num = -1; //找到最新一条提示与要添加的提示相同，则无需添加
                        break;
                    }
                }
            }
            if (num !== -1) {
                if (num === this.maxCount) {
                    //浮动提示无空余 需先上浮 并将标记位减1
                    this.tipTextPop();
                    --num;
                }
                this.createTipText({ number: num, string: data.string });
            }
        } else {
            //当提示为信息提示
            var haveStr = this.checkTipTextFree();
            if (haveStr === this.maxCount - 1) {
                this.tipTextPop();
                this.createTipText({ number: haveStr, string: data.string });
            } else {
                this.createTipText({ number: haveStr + 1, string: data.string });
            }
        }
    },

    createTipText: function createTipText(data) {
        var node = this.node.getChildByName('tiptext' + data.number);
        node.getComponent(cc.RichText).string = data.string;

        this.startWholeAction(node);
    },

    startWholeAction: function startWholeAction(node) {
        //回调函数中重置
        var callback = cc.callFunc(function (node) {
            //cc.log('startWholeActioncallback', node.tag);
            node.getComponent(cc.RichText).string = '';
            node.scale = 2;
        });
        var scale1 = cc.scaleTo(0.1, 1);
        var hold = cc.moveBy(3, cc.v2(0, 0));
        var scale0 = cc.scaleTo(0.2, 0);
        node.runAction(cc.sequence(scale1, hold, scale0, callback));
    },

    showAndEndAction: function showAndEndAction(node) {
        //cc.log('showAndEndAction:', node.tag);
        //回调函数中重置
        var callback = cc.callFunc(function (node) {
            //cc.log('showAndEndActioncallback', node.tag);
            node.getComponent(cc.RichText).string = '';
            node.scale = 2;
        });
        var hold = cc.moveBy(2, cc.v2(0, 0));
        var scale0 = cc.scaleTo(0.2, 0);
        node.runAction(cc.sequence(hold, scale0, callback));
    },

    tipTextPop: function tipTextPop() {
        var self = this;
        for (var i = 0; i < this.maxCount; i++) {
            self.node.getChildByName('tiptext' + i).stopAllActions();
        }

        for (var _i = 0; _i < this.maxCount - 1; _i++) {
            self.node.getChildByName('tiptext' + _i).getComponent(cc.RichText).string = self.node.getChildByName('tiptext' + (_i + 1)).getComponent(cc.RichText).string;
            self.node.getChildByName('tiptext' + _i).scale = 1;
            self.showAndEndAction(self.node.getChildByName('tiptext' + _i));
        }
    }

});

cc._RF.pop();
},{}],"town_camera":[function(require,module,exports){
"use strict";
cc._RF.push(module, '7f757kDCvNOF5LfNnoGXOqV', 'town_camera');
// Script/town/town_camera.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        logText: cc.Label,
        bg: cc.Node,
        summoner: cc.Node
    },

    // use this for initialization
    onLoad: function onLoad() {
        this.touchStartPos = cc.v2(0, 0);
        this.touchCurPos = cc.v2(0, 0);

        this.registerEvent();

        // //创建鼠标点击特效
        this.clickNode = cc.find('click');
        // this.node.on(cc.Node.EventType.TOUCH_START, (event) =>{

        // });

        //场景内物件绑定UI
        this.thingBindUI();
    },

    start: function start() {
        // cc.game.tipLayout.node.pauseSystemEvents(true);
    },


    bgMove: function bgMove() {
        var bg = this.bg;
        var pos = this.bg.getPosition();
        var dx = Math.floor(this.touchCurPos.x - this.touchStartPos.x);
        var winSize = cc.director.getVisibleSize();
        var finalX = 0;
        var max = 0;
        var min = -bg.getContentSize().width + winSize.width;
        //已达到两端无需移动
        if (pos.x >= max && dx > 0) {
            finalX = max;
        } else if (pos.x <= min && dx < 0) {
            finalX = min;
        } else {
            finalX = pos.x + dx / bg.getContentSize().width * winSize.width * 0.05;
            finalX < min ? finalX = min : 1;
            finalX > max ? finalX = max : 1;
        }
        bg.setPosition(finalX, pos.y);
    },

    registerEvent: function registerEvent() {
        // this.bg.on(cc.Node.EventType.TOUCH_START, (event) =>{
        //     let touches = event.getTouches();
        //     let touchLoc = touches[0].getLocation();
        //     this.touchStartPos = touchLoc;

        //     //鼠标点击特效
        //     this.clickNode.setPosition(touchLoc);
        //     let src = this.clickNode.getComponent('clickdown');
        //     src.clicked();
        // }, this);

        // this.bg.on(cc.Node.EventType.TOUCH_MOVE, (event) =>{
        //     let touches = event.getTouches();
        //     let touchLoc = touches[0].getLocation();
        //     this.touchCurPos = touchLoc;
        //     this.logText.string = '(' + Math.floor(touchLoc.x) + ' . ' + Math.floor(touchLoc.y) + ')';
        //     this.bgMove();
        // }, this);

        // this.bg.on(cc.Node.EventType.TOUCH_END, (event) =>{
        //     this.touchStartPos = cc.v2(0, 0);
        //     this.touchCurPos = cc.v2(0, 0);
        // }, this);

        this.bg.on(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.bg.on(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.on(cc.Node.EventType.TOUCH_END, this.touchEnd, this);
        //cc.log('registerEvent-on');
    },

    touchStart: function touchStart(event) {
        var touches = event.getTouches();
        var touchLoc = touches[0].getLocation();
        this.touchStartPos = touchLoc;

        //鼠标点击特效
        this.clickNode.setPosition(touchLoc);
        this.clickNode.getComponent('clickdown').clicked();
    },
    touchMove: function touchMove(event) {
        var touches = event.getTouches();
        var touchLoc = touches[0].getLocation();
        this.touchCurPos = touchLoc;
        this.logText.string = '(' + Math.floor(touchLoc.x) + ' . ' + Math.floor(touchLoc.y) + ')';
        this.bgMove();
    },
    touchEnd: function touchEnd(event) {
        this.touchStartPos = cc.v2(0, 0);
        this.touchCurPos = cc.v2(0, 0);
    },


    unregisterEvent: function unregisterEvent() {
        this.bg.off(cc.Node.EventType.TOUCH_START, this.touchStart, this);
        this.bg.off(cc.Node.EventType.TOUCH_MOVE, this.touchMove, this);
        this.bg.off(cc.Node.EventType.TOUCH_END, this.touchEnd, this);

        //this.bg.targetOff(this.bg);
        //cc.log('unregisterEvent-off');
    },

    onDestroy: function onDestroy() {
        // cc.log('camere onDestroy');
        this.unregisterEvent();
    },


    thingBindUI: function thingBindUI() {
        // this.summoner.on(cc.Node.EventType.TOUCH_END, this.summonUIManager);
    }

});

cc._RF.pop();
},{}],"town_main":[function(require,module,exports){
"use strict";
cc._RF.push(module, '187969X5i9HHLFow/PwfxNx', 'town_main');
// Script/town/town_main.js

'use strict';

var dataManager = require('dataManager');

var WildRandomEventKindName = ['', 'collect', 'occupy', 'battle'];
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        logText: cc.Label,
        canvas: cc.Node,
        goldlabel: cc.Label,
        rmblabel: cc.Label,
        vitlabel: cc.Label
    },

    // use this for initialization
    onLoad: function onLoad() {

        cc.director.preloadScene('wild');

        //cc.game.addPersistRootNode(this.node);

        this.loadResData();
        this.loadIDData();
        cc.game.res.mercenarys = dataManager.readData('mercenarys');
        cc.game.res.items = dataManager.readData('items');
        cc.game.res.formation = dataManager.readData('formation');

        // //获得常驻节点-提示信息
        // this.tipLayout = cc.find('tiplayout');


        // //显示城镇场景常驻节点
        // var townNode = cc.find('Canvas');
        // townNode.opacity = 255;

        //提示信息屏蔽响应
        cc.game.tipLayout.node.pauseSystemEvents(true);

        if (!cc.game.infor.calcedOffRewards) {
            this.offTime = 0;
            //计算离线奖励
            this.calcOffRewards();

            //将增加提示文字作为全局函数
            cc.game.addTipText = this.addTipText;

            cc.game.infor.calcedOffRewards = true;
        }

        //注册界面
        this.initUI();
    },

    start: function start() {
        //cc.log('Start');
        this.refreshResUI();
        this.refreshIDUI();
    },

    // onDestroy: function(){
    //     cc.log('onDestroy');
    // },


    loadResData: function loadResData() {
        cc.game.res.gold = Number(dataManager.readData('gold'));
        cc.game.res.rmb = Number(dataManager.readData('rmb'));
        cc.game.res.vit = Number(dataManager.readData('vit'));
        //cc.log('loadResData', cc.game.res.gold, cc.game.res.rmb, cc.game.res.vit);
    },

    loadIDData: function loadIDData() {
        //vip等级
        cc.game.res.vipLV = Number(dataManager.readData('vipLV'));
        //累积充值
        cc.game.res.recharge = Number(dataManager.readData('recharge'));
        //玩家等级
        cc.game.res.userLV = Number(dataManager.readData('userLV'));
        //玩家经验
        cc.game.res.userEXP = Number(dataManager.readData('userEXP'));
    },

    refreshResUI: function refreshResUI() {

        this.goldlabel.string = cc.game.res.gold;
        this.rmblabel.string = cc.game.res.rmb;
        this.vitlabel.string = cc.game.res.vit;

        //cc.log('refreshResUI', cc.game.res.gold, cc.game.res.rmb, cc.game.res.vit);
    },

    refreshIDUI: function refreshIDUI() {
        cc.log('refreshIDUI:');

        //玩家昵称
        var nameNode = cc.find('Canvas/ui/head/namebg/namelabel');
        nameNode.getComponent('cc.Label').string = cc.game.res.nickName;

        //vip等级
        var vipNode = cc.find('Canvas/ui/head/vipbg/viplv');
        vipNode.getComponent('cc.Label').string = 'VIP ' + cc.game.res.vipLV;

        //玩家等级
        var lvNode = cc.find('Canvas/ui/head/bg/lvlabel');
        lvNode.getComponent('cc.Label').string = cc.game.res.userLV;
    },

    resUIEffect: function resUIEffect(data) {
        if (data.type) {
            var lname = data.type + 'label';
            var label = this[lname];
            var d = 0.2;
            var tint = null;
            if (data.value > 0) {
                tint = cc.tintTo(d, 0, 240, 10);
            } else {
                tint = cc.tintTo(d, 255, 0, 0);
            }

            var tintBack = cc.tintTo(d, 255, 255, 255);
            var seq = cc.sequence(tint, tintBack);
            var rep = cc.repeat(seq, 2);
            label.node.runAction(rep);
        }
    },

    changeDataEvent: function changeDataEvent(data) {
        if (data.type === 'gold' || data.type === 'rmb' || data.type === 'vit') {
            this.refreshResUI();
            this.resUIEffect(data);
        } else if (data.type === 'recharge') {
            if (this.checkVIPHasUpgrade()) {
                this.refreshIDUI();
            }
        } else if (data.type === 'userEXP') {
            if (this.checkUserLVHasUpgrade()) {
                this.refreshIDUI();
            }
        }

        if (data.type === 'gold' || data.type === 'rmb' || data.type === 'vit' || data.type === 'recharge' || data.type === 'userEXP') {
            var str = this.getStringForType(data);
            this.addTipText({ type: 2, string: str });
            // cc.log('changeDataEvent:', data.type, data.value);
        }
    },

    checkVIPHasUpgrade: function checkVIPHasUpgrade() {
        if (cc.game.data.recharge) {
            var num = cc.game.res.recharge;
            var count = 0;
            var ref = false;
            var lv = 0;
            for (var i in cc.game.data.recharge) {
                count += Number(cc.game.data.recharge[i]);
                if (num >= count && Number(i) >= cc.game.res.vipLV) {
                    ref = true;
                    lv = Number(i);
                } else if (num < count) {
                    break;
                }
            }
            if (ref) {
                dataManager.coverData({ type: 'vipLV', value: lv });
            }
            return ref;
        }
    },

    checkUserLVHasUpgrade: function checkUserLVHasUpgrade() {
        if (cc.game.data.userEXP) {
            var num = cc.game.res.userEXP;
            var ref = false;
            var lv = cc.game.res.userLV;
            for (var i in cc.game.data.userEXP) {
                if (i >= lv) {
                    if (num >= Number(cc.game.data.userEXP[i])) {
                        ref = true;
                        num -= Number(cc.game.data.userEXP[i]);
                        lv = Number(i);
                    } else if (num < Number(cc.game.data.userEXP[i])) {
                        break;
                    }
                }
            }
            if (ref) {
                dataManager.coverData({ type: 'userLV', value: lv });
                dataManager.coverData({ type: 'userEXP', value: num });
            }
            return ref;
        }
    },

    addTipText: function addTipText(data) {
        var tipLayoutSrc = cc.find('tiplayout').getComponent('tipLayout');
        if (!tipLayoutSrc) {
            cc.log('addTipText false');
            return;
        }
        tipLayoutSrc.addTipText(data);
    },

    resType2String: function resType2String(type) {
        var typeText = '';
        var colorText = '';
        switch (type) {
            case "gold":
                colorText = '#FCE800';
                typeText = '金币';
                break;
            case "rmb":
                colorText = '#8300FC';
                typeText = '钻石';
                break;
            case "vit":
                colorText = '#32FC00';
                typeText = '体力';
                break;
            case "recharge":
                colorText = '#32FC00';
                typeText = '累充';
                break;
            case "userEXP":
                colorText = '#32FC00';
                typeText = '经验';
                break;
            case "items":
                colorText = '#32FC00';
                typeText = '道具';
                break;
        }
        return { type: typeText, color: colorText };
    },

    getStringForType: function getStringForType(data) {
        var ref = '';
        var sth = this.resType2String(data.type);

        if (data.value > 0) {
            ref = '获得';
        } else {
            ref = '消耗';
        }

        return '<color=#FFFFFF>' + ref + '</c><color=' + sth.color + '>' + Math.abs(data.value) + sth.type + '</color>';
        //获得4000金钱 
        //<color=#00ff00>Rich</c><color=#0fffff>Text</color>
    },

    calcOffRewards: function calcOffRewards() {
        cc.log('calcOffRewards_start');
        if (cc.game.infor.calcedOffRewards) return;
        this.offTime = this.calcOffTime();
        //??
        //this.offTime = 1440;
        var str = this.time2String(this.offTime);

        if (this.offTime > 0) {
            this.addTipText({ type: 1, string: str });
        }
        //计算离线时间内应获得奖励
        //获取配置数据
        if (cc.game.data.wildaward) {
            var data = cc.game.data.wildaward;
            //计算随机事件平均耗时
            var time = 0;
            var count = 0;
            for (var _i in data) {
                time += Number(data[_i][0].duration);
                ++count;
            }

            time = Math.round(time / count);
            // cc.log('calcOffRewards', this.offTime, time);
            //如果离线时间小于平均耗时 则无奖励
            if (this.offTime < time) {
                return;
            }
            //计算随机事件次数
            var times = Math.floor(this.offTime / time);
            //根据次数统计所有奖励
            var awards = {};
            for (var i in data) {
                var kindTimes = times * data[i][0].chance;
                for (var j in data[i][0].award) {
                    for (var k in WildAwardKind) {
                        var kStr = WildAwardKind[k];
                        // if(data[i][0].award[j][kStr] && kStr !== 'items'){
                        //     let num = Math.floor(kindTimes * data[i][0].award[j][kStr]);
                        //     //cc.log('cala···········:', num, kindTimes, kStr, data[i][0].award[j][kStr]);
                        //     awards = cc.game.commonMethod.dataStatistics(awards, {type: kStr, value: num});
                        // }
                        if (data[i][0].award[j][kStr]) {
                            if (kStr === 'items') {
                                for (var o in data[i][0].award[j][kStr]) {
                                    var num = Math.floor(kindTimes * data[i][0].award[j].chance * data[i][0].award[j][kStr][o].count);
                                    awards = cc.game.commonMethod.dataStatistics(awards, { type: kStr, id: Number(data[i][0].award[j][kStr][o].id), value: num });
                                    // cc.log('cala······item·····:', num, kindTimes, kStr, data[i][0].award[j][kStr]);
                                }
                            } else {
                                var _num = Math.floor(kindTimes * data[i][0].award[j][kStr]);
                                // cc.log('cala···········:', num, kindTimes, kStr, data[i][0].award[j][kStr]);
                                awards = cc.game.commonMethod.dataStatistics(awards, { type: kStr, value: _num });
                            }
                        }
                    }
                }
            }
            cc.log('calcOffRewards_calcend');
            //发放离线奖励
            cc.game.commonMethod.grantRewards(awards);
            // for(let i in awards){
            //     cc.log('bianli:', i, awards[i]);
            //     dataManager.changeData({type: i, value: awards[i]});
            // }
            //获得离线奖励UI节点
            var offNode = this.node.getChildByName('ui').getChildByName('off');

            var btn = offNode.getChildByName('btn');
            var content = offNode.getChildByName('content');
            var _str = '  ' + this.time2String(this.offTime);
            _str = _str + '  离线时间内共获得：\n  ';
            for (var i in awards) {
                if (i !== 'items') {
                    var string = this.resType2String(i);
                    var s = '<color=' + string.color + '>  ' + Math.abs(awards[i]) + string.type + '\n</color>';
                    _str = _str + s;
                }
            }
            content.getComponent(cc.RichText).string = _str;
            offNode.active = true;
            btn.on(cc.Node.EventType.TOUCH_END, this.offUI.bind(this));
        }
        cc.log('calcOffRewards_end');
    },

    offUI: function offUI() {
        var offNode = this.node.getChildByName('ui').getChildByName('off');
        if (offNode.active) {
            offNode.active = false;
        } else {
            offNode.active = true;
        }
    },

    time2String: function time2String(num) {
        var str = '';
        if (num === 0) {
            str = null;
        } else if (num < 60) {
            str = '<color=#FFFFFF>本次登陆离线时间:</c><color=#16ECFF>' + num + '分钟\n</color>';
        } else if (num < 1440) {
            var hour = Math.floor(num / 60);
            num = num % 60;
            cc.log('time2String:', num);
            str = '<color=#FFFFFF>本次登陆离线时间:</c><color=#1698FF>' + hour + '小时' + num + '分\n</color>';
        } else {
            str = '<color=#FFFFFF>本次登陆离线时间:</c><color=#1673FF>24小时\n</color>';
        }
        return str;
    },

    calcOffTime: function calcOffTime() {
        var last = dataManager.readData('lastLoginTime');
        //cc.log('calcOffTime:', last, typeof(last));
        if (-99999 === Number(last)) {
            //cc.log('calcOffTime: newcomer offtime is 0');
            return 0;
        }
        var now = Date.now();
        var sub = Math.floor((now - last) / 60000); //离线时间转为分钟
        sub > 1440 ? sub = 1440 : 1; //离线时间最多为24小时??
        return sub;
    },

    initUI: function initUI() {},

    checkResEnough: function checkResEnough(data) {
        if (cc.game.res[data.type] < data.value) {
            cc.log('资源不够', cc.game.res[data.type], data.value);
            var sth = this.resType2String(data.type);
            if (data.tip) {
                var str = '<color=' + sth.color + '>' + sth.type + '</c><color=#FFFFFF>不足</color>';
                this.addTipText({ type: 1, string: str });
            }
            return false;
        }
        return true;
    }

});

cc._RF.pop();
},{"dataManager":"dataManager"}],"town_pre":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'ff7c7HHWVRHuKSzsS2+OgS9', 'town_pre');
// Script/town/town_pre.js

'use strict';

var KindIntro = ['', 'ALL', '4', '3', '2', '1'];

var xStart = -170;
var xSpace = 90;
var yStart = 140;
var ySpace = -50;
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        preUI: cc.Node,
        maxKind: 0, //显示类型标签:1-全部 2-SSR 3-SR 4-R 5-N
        prefabMercenary: cc.Prefab,
        prefabMercenaryIcon: cc.Prefab,
        prefabPos: cc.Prefab,
        prefabOnFormation: cc.Prefab,
        prefabAttrview: cc.Prefab

    },

    // use this for initialization
    onLoad: function onLoad() {

        var taggroup = this.preUI.getChildByName('mercenary').getChildByName('taggroup');
        for (var i = 1; i <= this.maxKind; i++) {
            var node = taggroup.getChildByName('tag' + i);
            cc.game.commonMethod.registerParamTouchEvent(node, this.node, 'town_pre', 'showArmygroup', i, i);
        }

        this.showKindFlag = 1;
        this.showList = [];
        this.setMasterMode(1);

        this.preUI.getChildByName('master').on(cc.Node.EventType.TOUCH_END, this.masterSwtich.bind(this));

        var closeBtn = this.preUI.getChildByName('closebtn');
        closeBtn.on(cc.Node.EventType.TOUCH_END, this.perUIManager.bind(this));
    },
    setMasterMode: function setMasterMode(flag) {
        this.masterMode = flag; //1佣兵 2阵型
        if (flag === 1) {
            this.preUI.getChildByName('mercenary').active = true;
            this.preUI.getChildByName('formation').active = false;
            this.preUI.getChildByName('master').getChildByName('label').getComponent(cc.Label).string = '阵型';
            this.preUI.getChildByName('title').getComponent(cc.Label).string = '佣兵';
        } else {
            this.preUI.getChildByName('mercenary').active = false;
            this.preUI.getChildByName('formation').active = true;
            this.preUI.getChildByName('master').getChildByName('label').getComponent(cc.Label).string = '佣兵';
            this.preUI.getChildByName('title').getComponent(cc.Label).string = '阵型';
            this.showFormation();
        }
    },
    masterSwtich: function masterSwtich() {
        var n = this.masterMode === 1 ? 0 : 1;
        this.setMasterMode(n);
    },


    perUIManager: function perUIManager() {
        //cc.log('perUIManager');
        if (this.preUI.active === true) {
            this.preUI.active = false;
        } else {
            this.preUI.active = true;
            this.showArmygroup();
        }
    },

    refreshArmyIconGroup: function refreshArmyIconGroup() {
        //先清除
        this.preUI.getChildByName('formation').getChildByName('armygroup').getChildByName('view').getChildByName('content').removeAllChildren();
        var data = cc.game.data.mercenary;
        var list = {};
        var length = -1;
        for (var i in data.mercenary) {
            var check = cc.game.commonMethod.checkIsHaveMercenary(data.mercenary[i].id);
            if (check.ref) {
                ++length;
                list[length] = cc.instantiate(this.prefabMercenaryIcon);
                list[length].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.armyicon.getSpriteFrame(data.mercenary[i].icon);
                var ref = cc.game.commonMethod.checkFormation(Number(data.mercenary[i].id));
                if (ref >= 0) {
                    list[length].getChildByName('tip').active = true;
                    list[length].getChildByName('tip').color = cc.color(245, 245, 13, 255);
                    list[length].getChildByName('tip').getComponent(cc.Label).string = '上阵';
                } else if (ref < 0 && ref > -100) {
                    list[length].getChildByName('tip').active = true;
                    list[length].getChildByName('tip').color = cc.color(13, 245, 199, 255);
                    list[length].getChildByName('tip').getComponent(cc.Label).string = '助阵';
                } else if (ref === -100) {
                    list[length].getChildByName('tip').active = false;
                }
                list[length].targetOff(list[length]);
                list[length].on(cc.Node.EventType.TOUCH_START, this.selectMercenaryStart.bind(this));
                list[length].on(cc.Node.EventType.TOUCH_MOVE, this.selectMercenaryMoving.bind(this));
                list[length].on(cc.Node.EventType.TOUCH_CANCEL, this.selectMercenaryCancel.bind(this));
                list[length].on(cc.Node.EventType.TOUCH_END, this.selectMercenaryEnd.bind(this));

                cc.game.commonMethod.registerParamTouchEvent(list[length], this.node, 'town_pre', 'selectMercenaryStart', data.mercenary[i].id, data.mercenary[i].id);

                this.preUI.getChildByName('formation').getChildByName('armygroup').getChildByName('view').getChildByName('content').addChild(list[length]);
            }
        }
    },


    //刷新显示上阵佣兵
    refreshOnFormation: function refreshOnFormation() {
        this.onFormation = [];
        var length = -1;
        for (var i in cc.game.res.mercenarys) {
            if (cc.game.res.mercenarys[i].state >= 0) {
                ++length;
                var idx = cc.game.res.mercenarys[i].state;
                // cc.log("i, idx:", i ,idx);
                //this.preUI.getChildByName('formation').getChildByName('posgroup').getChildByTag(idx).getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos2');
                this.posList[idx].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos2');

                this.addOnFormation(length, idx, Number(cc.game.res.mercenarys[i].id));
            }
        }
    },


    //添加已上阵佣兵显示 pN已上阵佣兵列表中索引 pIdx阵型位置 pId佣兵在佣兵表中ID
    addOnFormation: function addOnFormation(pN, pIdx, pId) {
        var self = this;
        if (pN >= 0) {
            self.onFormation[pN] = cc.instantiate(self.prefabOnFormation);
            self.onFormation[pN].mercenaryId = pId;
            self.onFormation[pN].mercenaryPos = pIdx;
            self.onFormation[pN].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.armyicon.getSpriteFrame(cc.game.data.mercenary.mercenary[pId].icon);
            // self.preUI.getChildByName('formation').getChildByName('posgroup').getChildByTag(pIdx).addChild(self.onFormation[pN]);
            // self.onFormation[pN].setPosition(25, 0);        //??向右偏移 方便查看上阵特效改变
            self.preUI.getChildByName('formation').getChildByName('posgroup').addChild(self.onFormation[pN]);
            self.onFormation[pN].setPosition(xStart + pIdx % 5 * xSpace, yStart + Math.floor(pIdx / 5) * ySpace);

            self.onFormation[pN].targetOff(self.onFormation[pN]);
            self.onFormation[pN].on(cc.Node.EventType.TOUCH_START, self.onFormationMercenaryStart.bind(self));
            self.onFormation[pN].on(cc.Node.EventType.TOUCH_MOVE, self.onFormationMercenaryMoving.bind(self));
            self.onFormation[pN].on(cc.Node.EventType.TOUCH_CANCEL, self.onFormationMercenaryCancel.bind(self));
            self.onFormation[pN].on(cc.Node.EventType.TOUCH_END, self.onFormationMercenaryEnd.bind(self));

            cc.game.commonMethod.registerParamTouchEvent(self.onFormation[pN], self.node, 'town_pre', 'onFormationMercenaryStart', pN, pN);
        } else {
            var ref = 0;
            var n = -1;
            for (var i in self.onFormation) {
                if (self.onFormation[i] && pIdx === self.onFormation[i].mercenaryPos) {
                    ref = 1;
                    n = Number(i);
                    break;
                } else if (self.onFormation[i] && pId === self.onFormation[i].mercenaryId) {
                    ref = 2;
                    n = Number(i);
                    break;
                }
            }
            if (ref === 1) {
                self.onFormation[n].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.armyicon.getSpriteFrame(cc.game.data.mercenary.mercenary[pId].icon);
                self.onFormation[n].setPosition(xStart + pIdx % 5 * xSpace, yStart + Math.floor(pIdx / 5) * ySpace);
            } else if (ref === 2) {
                self.onFormation[n].setPosition(xStart + pIdx % 5 * xSpace, yStart + Math.floor(pIdx / 5) * ySpace);
            } else {
                self.addOnFormation(self.onFormation.length, pIdx, pId);
            }
        }
    },
    showFormation: function showFormation() {
        //初始化阵型位置
        this.posList = [];
        //先清除
        this.preUI.getChildByName('formation').getChildByName('posgroup').removeAllChildren();
        for (var i = 0; i <= 24; ++i) {
            this.posList[i] = cc.instantiate(this.prefabPos);
            this.posList[i].setPosition(xStart + i % 5 * xSpace, yStart + Math.floor(i / 5) * ySpace);
            this.posList[i].setTag(i);
            this.preUI.getChildByName('formation').getChildByName('posgroup').addChild(this.posList[i]);
        }

        this.refreshArmyIconGroup();

        this.refreshOnFormation();
    },
    onFormationMercenaryStart: function onFormationMercenaryStart(event, customEventData) {
        //cc.log('onFormationMercenaryStart', event, customEventData, event.target.tag);
        var self = this;
        self.selectMerLight = event.target.mercenaryPos; //移动过程中悬停的位置索引 决定位置是否亮起
        //let pos = self.preUI.getChildByName('formation').convertToNodeSpaceAR(event.touch.getLocation());
        //event.target.startPos = pos;
    },
    onFormationMercenaryMoving: function onFormationMercenaryMoving(event) {
        var self = this;
        var tag = event.target.tag;
        var pos = event.touch.getLocation();
        //let touchPos = self.onFormation[tag].convertToNodeSpaceAR(event.touch.getLocation());
        var touchPos = self.onFormation[tag].parent.convertTouchToNodeSpace(event.touch);
        //cc.log('onMoving', tag, touchPos, pos);
        self.onFormation[tag].setPosition(touchPos);

        var targetSize = event.target.getContentSize();
        var minX = xStart - targetSize.width / 2;
        var maxX = xStart + 4 * xSpace + targetSize.width / 2;
        var minY = yStart + 4 * ySpace - targetSize.height / 2;
        var maxY = yStart + targetSize.height / 2;
        var stepX = Math.floor((maxX - minX) / 5);
        var stepY = Math.floor(Math.abs(maxY - minY) / 5);
        //cc.log('minx, maxx, miny,maxy,stepx, stepy:', minX, maxX, minY, maxY);
        if (touchPos.x >= minX && touchPos.x <= maxX && touchPos.y <= maxY && touchPos.y >= minY) {
            var xIdx = Math.floor(Math.abs(touchPos.x - 1 - minX) / stepX);
            var yIdx = Math.floor(Math.abs(maxY - 1 - touchPos.y) / stepY);
            var idx = xIdx + yIdx * 5;
            //cc.log('在阵型位置区域内', xIdx, yIdx);
            if (self.selectMerLight !== -1 && self.selectMerLight !== idx) {
                var pIdx = cc.game.commonMethod.checkFormation4Pos(self.selectMerLight);
                if (0 > pIdx || cc.game.res.mercenarys[pIdx].id === event.target.mercenaryId) {
                    self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos1');
                }
                self.selectMerLight = idx;
                self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos2');
            }
        } else {
            if (self.selectMerLight !== -1) {
                if (0 > cc.game.commonMethod.checkFormation4Pos(self.selectMerLight)) {
                    self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos1');
                }
                self.selectMerLight = -1;
            }
        }
    },
    onFormationMercenaryCancel: function onFormationMercenaryCancel() {
        var self = this;
        var tag = event.target.tag;
        var pos = event.touch.getLocation();
        //let touchPos = self.onFormation[tag].convertToNodeSpaceAR(event.touch.getLocation());
        var touchPos = self.onFormation[tag].parent.convertTouchToNodeSpace(event.touch);
        //cc.log('onMoving', tag, touchPos, pos);
        self.onFormation[tag].setPosition(touchPos);

        var targetSize = event.target.getContentSize();
        var minX = xStart - targetSize.width / 2;
        var maxX = xStart + 4 * xSpace + targetSize.width / 2;
        var minY = yStart + 4 * ySpace - targetSize.height / 2;
        var maxY = yStart + targetSize.height / 2;
        var stepX = Math.floor((maxX - minX) / 5);
        var stepY = Math.floor(Math.abs(maxY - minY) / 5);
        //cc.log('minx, maxx, miny,maxy,stepx, stepy:', minX, maxX, minY, maxY);
        if (touchPos.x >= minX && touchPos.x <= maxX && touchPos.y <= maxY && touchPos.y >= minY) {
            var xIdx = Math.floor(Math.abs(touchPos.x - 1 - minX) / stepX);
            var yIdx = Math.floor(Math.abs(maxY - 1 - touchPos.y) / stepY);
            var idx = xIdx + yIdx * 5;
            //cc.log('在阵型位置区域内', xIdx, yIdx);
            var pIdx = cc.game.commonMethod.checkFormation4Pos(idx);
            //如果最终位置已有佣兵上阵 则交换两个佣兵上阵信息
            if (0 <= pIdx) {
                //self.addOnFormation(-1, self.onFormation[tag].mercenaryPos, Number(cc.game.res.mercenarys[pIdx].id));
                cc.game.commonMethod.intoFormation(2, Number(cc.game.res.mercenarys[pIdx].id), self.onFormation[tag].mercenaryPos);
            }
            //上阵
            //self.addOnFormation(-1, idx, self.onFormation[tag].mercenaryId);
            cc.game.commonMethod.intoFormation(2, self.onFormation[tag].mercenaryId, idx);
            self.showFormation();
        } else {
            //下阵
            cc.game.commonMethod.leaveFormation(self.onFormation[tag].mercenaryId, -1);
            //移除选中的已上阵佣兵
            self.deleteOnFormationMer(tag);
            self.showFormation();
        }
    },
    deleteOnFormationMer: function deleteOnFormationMer(tag) {
        var self = this;
        self.onFormation[tag].removeFromParent(false);
        self.onFormation[tag].destroy();
        self.onFormation[tag] = null;
        //self.onFormation.splice(tag);
    },
    onFormationMercenaryEnd: function onFormationMercenaryEnd(event) {
        var self = this;
        var tag = event.target.tag;
        var pos = event.touch.getLocation();
        //let touchPos = self.onFormation[tag].convertToNodeSpaceAR(event.touch.getLocation());
        var touchPos = self.onFormation[tag].parent.convertTouchToNodeSpace(event.touch);
        //cc.log('onMoving', tag, touchPos, pos);
        self.onFormation[tag].setPosition(touchPos);

        var targetSize = event.target.getContentSize();
        var minX = xStart - targetSize.width / 2;
        var maxX = xStart + 4 * xSpace + targetSize.width / 2;
        var minY = yStart + 4 * ySpace - targetSize.height / 2;
        var maxY = yStart + targetSize.height / 2;
        var stepX = Math.floor((maxX - minX) / 5);
        var stepY = Math.floor(Math.abs(maxY - minY) / 5);
        //cc.log('minx, maxx, miny,maxy,stepx, stepy:', minX, maxX, minY, maxY);
        if (touchPos.x >= minX && touchPos.x <= maxX && touchPos.y <= maxY && touchPos.y >= minY) {
            var xIdx = Math.floor(Math.abs(touchPos.x - 1 - minX) / stepX);
            var yIdx = Math.floor(Math.abs(maxY - 1 - touchPos.y) / stepY);
            var idx = xIdx + yIdx * 5;
            //cc.log('在阵型位置区域内', xIdx, yIdx);
            var pIdx = cc.game.commonMethod.checkFormation4Pos(idx);
            //如果最终位置已有佣兵上阵 则交换两个佣兵上阵信息
            if (0 <= pIdx) {
                //self.addOnFormation(-1, self.onFormation[tag].mercenaryPos, Number(cc.game.res.mercenarys[pIdx].id));
                cc.game.commonMethod.intoFormation(2, Number(cc.game.res.mercenarys[pIdx].id), self.onFormation[tag].mercenaryPos);
            }
            //上阵
            //self.addOnFormation(-1, idx, self.onFormation[tag].mercenaryId);
            cc.game.commonMethod.intoFormation(2, self.onFormation[tag].mercenaryId, idx);
            self.showFormation();
        } else {
            //下阵
            cc.game.commonMethod.leaveFormation(self.onFormation[tag].mercenaryId, -1);
            //移除选中的已上阵佣兵
            self.deleteOnFormationMer(tag);
            self.showFormation();
        }
    },
    selectMercenaryStart: function selectMercenaryStart(event, customEventData) {
        var self = this;
        self.selectMerId = Number(event.target.tag);
        if (cc.game.commonMethod.checkFormation(self.selectMerId) >= 0) {
            var str = '<color=#FFFFFF>已上阵</color><color=></c>';
            cc.game.commonMethod.addTipText({ type: 2, string: str });
            return;
        }
        self.selectMerLight = -1; //移动过程中悬停的位置索引 决定位置是否亮起

        var touchPos = self.preUI.getChildByName('formation').convertToNodeSpaceAR(event.touch.getLocation());
        //cc.log('Start', touchPos);
        self.selectMer = new cc.Node('selectMer');
        self.selectMer.anchorX = 0.5;
        self.selectMer.anchorY = 0.5;
        self.selectMer.width = 60;
        self.selectMer.height = 60;
        var sprite = self.selectMer.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.CUSTOM;

        sprite.spriteFrame = cc.game.spriteCache.armyicon.getSpriteFrame(cc.game.data.mercenary.mercenary[self.selectMerId].icon);
        self.selectMer.zIndex = 0;
        self.selectMer.parent = self.preUI.getChildByName('formation');
        self.selectMer.setPosition(touchPos);
    },
    selectMercenaryMoving: function selectMercenaryMoving(event) {

        var self = this;
        if (!self.selectMer) return;
        var touchPos = self.preUI.getChildByName('formation').convertToNodeSpaceAR(event.touch.getLocation());
        //cc.log('Moving', touchPos);
        self.selectMer.setPosition(touchPos);
        var selectMerSize = self.selectMer.getContentSize();
        var minX = xStart - selectMerSize.width / 2;
        var maxX = xStart + 4 * xSpace + selectMerSize.width / 2;
        var minY = yStart + 4 * ySpace - selectMerSize.height / 2;
        var maxY = yStart + selectMerSize.height / 2;
        var stepX = Math.floor((maxX - minX) / 5);
        var stepY = Math.floor(Math.abs(maxY - minY) / 5);
        //cc.log('minx, maxx, miny,maxy,stepx, stepy:', minX, maxX, minY, maxY);
        if (touchPos.x >= minX && touchPos.x <= maxX && touchPos.y <= maxY && touchPos.y >= minY) {
            var xIdx = Math.floor(Math.abs(touchPos.x - 1 - minX) / stepX);
            var yIdx = Math.floor(Math.abs(maxY - 1 - touchPos.y) / stepY);
            var idx = xIdx + yIdx * 5;
            // cc.log('Moving在阵型位置区域内', xIdx, yIdx);
            if (self.selectMerLight === -1) {
                self.selectMerLight = idx;
                self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos2');
            } else if (self.selectMerLight !== idx) {
                if (0 > cc.game.commonMethod.checkFormation4Pos(self.selectMerLight)) {
                    self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos1');
                }
                self.selectMerLight = idx;
                self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos2');
            }
        } else {
            if (self.selectMerLight !== -1) {
                if (0 > cc.game.commonMethod.checkFormation4Pos(self.selectMerLight)) {
                    self.posList[self.selectMerLight].getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.uigroup.getSpriteFrame('pos1');
                }
                self.selectMerLight = -1;
            }
            // self.selectMer.removeFromParent(false);
            // self.selectMer.destroy();
            // self.selectMer = null;
            // self.selectMerLight = -1;
            // return;
        }
    },
    selectMercenaryCancel: function selectMercenaryCancel(event) {
        var self = this;
        //if(1) return;
        //cc.log('Cancel');
        if (!self.selectMer) return;
        var touchPos = self.preUI.getChildByName('formation').convertToNodeSpaceAR(event.touch.getLocation());

        self.selectMer.setPosition(touchPos);
        var selectMerSize = self.selectMer.getContentSize();
        var minX = xStart - selectMerSize.width / 2;
        var maxX = xStart + 4 * xSpace + selectMerSize.width / 2;
        var minY = yStart + 4 * ySpace - selectMerSize.height / 2;
        var maxY = yStart + selectMerSize.height / 2;
        var stepX = Math.floor((maxX - minX) / 5);
        var stepY = Math.floor(Math.abs(maxY - minY) / 5);
        //cc.log('minx, maxx, miny,maxy,stepx, stepy:', minX, maxX, minY, maxY);
        if (touchPos.x >= minX && touchPos.x <= maxX && touchPos.y <= maxY && touchPos.y >= minY) {
            var xIdx = Math.floor(Math.abs(touchPos.x - 1 - minX) / stepX);
            var yIdx = Math.floor(Math.abs(maxY - 1 - touchPos.y) / stepY);
            var idx = xIdx + yIdx * 5;

            var pIdx = cc.game.commonMethod.checkFormation4Pos(idx);
            // cc.log('Cancel在阵型位置区域内', pIdx);
            //如果最终位置已有佣兵上阵 则将该位置原上阵佣兵下阵
            if (0 <= pIdx) {
                cc.game.commonMethod.leaveFormation(cc.game.res.mercenarys[pIdx].id, idx);
            }
            //上阵
            //self.addOnFormation(-1, idx, event.target.tag);
            cc.game.commonMethod.intoFormation(1, self.selectMerId, idx);
            self.showFormation();
        }
        //移除选中佣兵精灵
        self.deleteSelectMer();
    },
    deleteSelectMer: function deleteSelectMer() {
        // cc.log('deleteSelectMer');
        var self = this;
        //self.selectMer.removeFromParent(false);
        self.selectMer.active = false;
        self.selectMer.opacity = 0;
        self.selectMer.destroy();
        self.selectMer = null;
        self.selectMerLight = -1;
    },
    selectMercenaryEnd: function selectMercenaryEnd(event) {
        var self = this;
        var touchPos = self.preUI.getChildByName('formation').convertToNodeSpaceAR(event.touch.getLocation());
        //cc.log('End', touchPos);
        if (!self.selectMer) return;
        self.selectMer.setPosition(touchPos);
        var selectMerSize = self.selectMer.getContentSize();
        var minX = xStart - selectMerSize.width / 2;
        var maxX = xStart + 4 * xSpace + selectMerSize.width / 2;
        var minY = yStart + 4 * ySpace - selectMerSize.height / 2;
        var maxY = yStart + selectMerSize.height / 2;
        var stepX = Math.floor((maxX - minX) / 5);
        var stepY = Math.floor(Math.abs(maxY - minY) / 5);
        //cc.log('minx, maxx, miny,maxy,stepx, stepy:', minX, maxX, minY, maxY);
        if (touchPos.x >= minX && touchPos.x <= maxX && touchPos.y <= maxY && touchPos.y >= minY) {
            var xIdx = Math.floor(Math.abs(touchPos.x - 1 - minX) / stepX);
            var yIdx = Math.floor(Math.abs(maxY - 1 - touchPos.y) / stepY);

            var idx = xIdx + yIdx * 5;
            //cc.log('在阵型位置区域内', xIdx, yIdx, idx);
            var pIdx = cc.game.commonMethod.checkFormation4Pos(idx);
            //cc.log('在阵型位置区域内', pIdx);
            //如果最终位置已有佣兵上阵 则将该位置原上阵佣兵下阵
            if (0 <= pIdx) {
                cc.game.commonMethod.leaveFormation(cc.game.res.mercenarys[pIdx].id, idx);
            }
            //self.addOnFormation(-1, idx, event.target.tag);
            cc.game.commonMethod.intoFormation(1, self.selectMerId, idx);
            self.showFormation();
        }
        //移除选中佣兵精灵
        self.deleteSelectMer();
    },


    showArmygroup: function showArmygroup(event, customEventData) {
        //cc.log('showArmygroup', customEventData, typeof(customEventData));
        var self = this;

        //先清除
        self.preUI.getChildByName('mercenary').getChildByName('armygroup').getChildByName('view').getChildByName('content').removeAllChildren();

        //并非点击标签按钮 无参数 默认显示上次关闭时的类型状态
        if (!customEventData) {
            customEventData = this.showKindFlag;
        }
        //记录当前显示佣兵类型 1-全部 2-SSR 3-SR 4-R 5-N
        this.showKindFlag = customEventData;

        this.showArmy4Rule();
    },

    //按照规则显示对应佣兵
    showArmy4Rule: function showArmy4Rule() {
        // cc.log('showArmy4Rule_start');
        var self = this;
        var data = cc.game.data.mercenary;
        this.showList = [];
        var length = -1;
        for (var i in data.mercenary) {
            if (data.mercenary[i].name !== '' && self.checkKind(data.mercenary[i].quality, this.showKindFlag)) {
                ++length;
                this.showList[length] = cc.instantiate(self.prefabMercenary);
                this.showList[length].armyInfor = {};
                this.showList[length].armyInfor.id = Number(data.mercenary[i].id);
                this.showList[length].armyInfor.quality = Number(data.mercenary[i].quality);

                //更换贴图
                this.showList[length].getChildByName('sprite').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.armyicon.getSpriteFrame(data.mercenary[i].icon);

                this.showList[length].getChildByName('name').getComponent(cc.Label).string = data.mercenary[i].name;
                this.showList[length].getChildByName('name').color = cc.game.commonMethod.quality222Color(this.showList[length].armyInfor.quality).color4;

                //检查是否已拥有佣兵 未拥有需显示蒙版
                var check = cc.game.commonMethod.checkIsHaveMercenary(data.mercenary[i].id);
                if (check.ref) {
                    //拥有该佣兵
                    this.showList[length].getChildByName('hider').active = false;
                    this.showList[length].armyInfor.isOwn = true;
                    //注册查看佣兵详细信息按钮事件
                    cc.game.commonMethod.registerParamTouchEvent(self.showList[length], self.node, 'town_pre', 'showMercenaryInfor', data.mercenary[i].id);
                } else {
                    //未拥有
                    self.showList[length].getComponent(cc.Button).interactable = false;
                    this.showList[length].getChildByName('hider').active = true;
                    this.showList[length].armyInfor.isOwn = false;
                    //检测该佣兵碎片数量
                    var patchID = data.mercenary[i].composepatch;
                    var patchCount = data.mercenary[i].composeneed;
                    var sth = cc.game.commonMethod.checkHaveItemCount(patchID);
                    this.showList[length].getChildByName('hider').getChildByName('counttip').getComponent(cc.Label).string = sth.count + '/' + patchCount;
                    if (sth.count >= patchCount) {
                        this.showList[length].armyInfor.canCompose = true;
                        //拥有的碎片足够合成 显示合成按钮
                        this.showList[length].getChildByName('hider').getChildByName('owntip').active = false;
                        this.showList[length].getChildByName('hider').getChildByName('compose').active = true;
                        //合成按钮注册事件
                        cc.game.commonMethod.registerParamTouchEvent(this.showList[length].getChildByName('hider').getChildByName('compose'), self.node, 'town_pre', 'composeMercenary', data.mercenary[i].id, data.mercenary[i].id);
                    }
                }
            }
        }
        //佣兵列表排序方法：1.拆分为可合成、已拥有、未拥有不可合成三个分表；2.对3个分表分别进行细分排序（品质、ID）；3.将3个分表合并且进行显示
        var list = [];
        var list1 = [];
        var list2 = [];
        var list3 = [];
        var temp = [];
        var count = 0;
        var t = null;
        //排序
        for (var i in this.showList) {
            if (this.showList[i].armyInfor.canCompose) {
                //cc.log('发现一个可合成');
                list1.push(this.showList[i]);
                ++count;
            } else if (this.showList[i].armyInfor.isOwn) {
                //cc.log('发现一个已拥有');
                list2.push(this.showList[i]);
                ++count;
            } else if (!this.showList[i].armyInfor.isOwn && !this.showList[i].armyInfor.canCompose) {
                //cc.log('发现一个未拥有不可合成');
                list3.push(this.showList[i]);
                ++count;
            }
        }
        list1 = this.sort4Rule(list1);
        list2 = this.sort4Rule(list2);
        list3 = this.sort4Rule(list3);

        for (var i in list1) {
            list.push(list1[i]);
        }
        for (var i in list2) {
            list.push(list2[i]);
        }
        for (var i in list3) {
            list.push(list3[i]);
        }

        for (var i in this.showList) {
            //self.preUI.getChildByName('mercenary').getChildByName('armygroup').getChildByName('view').getChildByName('content').addChild(this.showList[i]);
            self.preUI.getChildByName('mercenary').getChildByName('armygroup').getChildByName('view').getChildByName('content').addChild(list[i]);
        }
        // cc.log('showArmy4Rule_end');
    },
    sort4Rule: function sort4Rule(table) {
        var t = null;
        for (var i = 0; i < table.length; ++i) {
            for (var j = i + 1; j < table.length; ++j) {
                if (table[i].armyInfor.quality < table[j].armyInfor.quality) {
                    t = table[j];
                    table[j] = table[i];
                    table[i] = t;
                } else if (table[i].armyInfor.quality === table[j].armyInfor.quality) {
                    if (table[i].armyInfor.id > table[j].armyInfor.id) {
                        t = table[j];
                        table[j] = table[i];
                        table[i] = t;
                    }
                }
            }
        }
        return table;
    },


    //显示佣兵详细资料
    showMercenaryInfor: function showMercenaryInfor(event, customEventData) {
        // cc.log('showMercenaryInfor', customEventData);
        customEventData = Number(customEventData);
        var check = cc.game.commonMethod.checkIsHaveMercenary(customEventData);

        if (check.idx >= 0) {
            cc.game.infor.curShowMercIdx = check.idx;
            cc.log('佣兵', check.idx, '为: ', cc.game.data.mercenary.mercenary[customEventData].name);
            var attrviewNode = cc.instantiate(this.prefabAttrview); //??
            attrviewNode.getComponent('attrview').init(customEventData);
            cc.find('Canvas/ui').addChild(attrviewNode);
        }
    },


    //合成佣兵
    composeMercenary: function composeMercenary(event, customEventData) {
        cc.log('composeMercenary', customEventData);
        customEventData = Number(customEventData);
        var self = this;
        //扣除碎片
        var mer = cc.game.data.mercenary.mercenary[customEventData]; //根据ID找配置信息 索引从零开始 错位减1 !!!已修复
        var patchID = Number(mer.composepatch);
        var patchCount = Number(mer.composeneed);
        //检测碎片是否足够扣除
        if (cc.game.commonMethod.itemsChangeData(patchID, -patchCount)) {
            //获得佣兵
            cc.game.commonMethod.gainNewMercenary(customEventData);
            //获得提示
            var color = cc.game.commonMethod.quality222Color(mer.quality);
            var str = '<color=#FFFFFF>获得</color><color=' + color + '>' + mer.name + '</c>';
            cc.game.commonMethod.addTipText({ type: 2, string: str });
            //获得佣兵广播??
            //刷新界面
            self.showArmygroup();
        }
    },

    checkKind: function checkKind(num, type) {
        //cc.log('checkKind', typeof(str), str, typeof(type), KindIntro[type]);
        if (KindIntro[type] === 'ALL' || num === KindIntro[type]) {
            return true;
        }
        return false;
    }

});

cc._RF.pop();
},{}],"town_summon":[function(require,module,exports){
"use strict";
cc._RF.push(module, 'ef51bNH3C5MboBsjZ/dg2Mk', 'town_summon');
// Script/town/town_summon.js

'use strict';

var dataManager = require('dataManager');
cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        summonUI: cc.Node,
        summonShow: cc.Node,
        onceCostType: '',
        onceCostNumber: 0,
        tentsCostType: '',
        tentsCostNumber: 0,
        prefabItem: cc.Prefab
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.log('town_summon_onload');
        this.awards = [];
        var once = this.summonUI.getChildByName('once');
        var tents = this.summonUI.getChildByName('tents');
        once.on(cc.Node.EventType.TOUCH_END, this.summonOnce.bind(this));
        tents.on(cc.Node.EventType.TOUCH_END, this.summonTents.bind(this));

        var onceBtn = this.summonShow.getChildByName('onceagain');
        onceBtn.on(cc.Node.EventType.TOUCH_END, this.summonOnce.bind(this));

        var closeBtn = this.summonShow.getChildByName('close');
        closeBtn.on(cc.Node.EventType.TOUCH_END, this.closeSummonShow.bind(this));

        var tentsBtn = this.summonShow.getChildByName('tentsagain');
        tentsBtn.on(cc.Node.EventType.TOUCH_END, this.summonTents.bind(this));

        var mainCloseBtn = this.summonUI.getChildByName('closebtn');
        mainCloseBtn.on(cc.Node.EventType.TOUCH_END, this.summonUIManager.bind(this));
    },

    summonUIManager: function summonUIManager() {
        cc.log('summonUIManager');

        //如果召唤显示界面显示则不打开召唤主界面
        if (this.summonShow.active === true) {
            return;
        }

        if (this.summonUI.active === true) {
            this.summonUI.active = false;
        } else {
            //显示召唤界面
            this.summonUI.active = true;

            //判断资源是否足够 决定显示文字颜色
            //一次
            var onceLabel = this.summonUI.getChildByName('once').getChildByName('price').getChildByName('num');
            this.checkResEnoughForUI(onceLabel, { type: this.onceCostType, value: this.onceCostNumber, tip: false });

            //十次
            var tentsLabel = this.summonUI.getChildByName('tents').getChildByName('price').getChildByName('num');
            this.checkResEnoughForUI(tentsLabel, { type: this.tentsCostType, value: this.tentsCostNumber, tip: false });
        }
    },

    summonOnce: function summonOnce() {
        cc.log('summonOnce');

        //检测资源是否足够
        var ref = this.checkResEnough({ type: this.onceCostType, value: this.onceCostNumber, tip: true });
        if (!ref) {
            return;
        }

        //先关闭召唤主界面
        this.summonUIManager();

        this.summonShow.active = true;

        this.summonShow.getChildByName('tentsagain').active = false;
        this.summonShow.getChildByName('onceagain').active = true;
        this.summonShow.getChildByName('award').removeAllChildren();

        //扣除召唤资源
        dataManager.changeData({ type: this.onceCostType, value: -this.onceCostNumber });

        //创建召唤一次奖励
        this.createAward(1);

        //??奖励加入数据库
        for (var i in this.awards) {
            if (this.awards[i]) {
                cc.game.commonMethod.itemsChangeData(this.awards[i].id, this.awards[i].count);
            }
        }

        //判断资源是否足够 决定显示文字颜色
        var onceLabel = this.summonShow.getChildByName('onceagain').getChildByName('price').getChildByName('num');
        this.checkResEnoughForUI(onceLabel, { type: this.onceCostType, value: this.onceCostNumber, tip: false });
    },

    summonTents: function summonTents() {
        cc.log('summonTents');

        //检测资源是否足够
        var ref = this.checkResEnough({ type: this.tentsCostType, value: this.tentsCostNumber, tip: true });
        if (!ref) {
            return;
        }

        //先关闭召唤主界面
        this.summonUIManager();

        this.summonShow.active = true;

        this.summonShow.getChildByName('tentsagain').active = true;
        this.summonShow.getChildByName('onceagain').active = false;
        this.summonShow.getChildByName('award').removeAllChildren();

        //扣除召唤资源
        dataManager.changeData({ type: this.tentsCostType, value: -this.tentsCostNumber });

        //创建召唤一次奖励
        this.createAward(10);

        //??奖励加入数据库
        for (var i in this.awards) {
            if (this.awards[i]) {
                cc.game.commonMethod.itemsChangeData(this.awards[i].id, this.awards[i].count);
            }
        }

        //判断资源是否足够 决定显示文字颜色
        var tentsLabel = this.summonShow.getChildByName('tentsagain').getChildByName('price').getChildByName('num');
        this.checkResEnoughForUI(tentsLabel, { type: this.tentsCostType, value: this.tentsCostNumber, tip: false });
    },

    createAward: function createAward(type) {
        this.awards = [];
        switch (type) {
            case 1:
                var idx = cc.game.commonMethod.randomAwardKind(cc.game.data.summonawards.summonawards);
                // cc.log('createAward:', idx, cc.game.data.summonawards.summonawards[idx]);
                var itemNode = this.createAwardItem(Number(cc.game.data.summonawards.summonawards[idx].id), Number(cc.game.data.summonawards.summonawards[idx].count));
                itemNode.parent = this.summonShow.getChildByName('award');
                itemNode.setPosition(0, 0);
                this.statisticsAwards(Number(cc.game.data.summonawards.summonawards[idx].id), Number(cc.game.data.summonawards.summonawards[idx].count));
                break;
            case 10:
                for (var i = 0; i < 10; i++) {
                    var _idx = cc.game.commonMethod.randomAwardKind(cc.game.data.summonawards.summonawards);
                    // cc.log('createAward:', idx, cc.game.data.summonawards.summonawards[idx]);
                    var _itemNode = this.createAwardItem(Number(cc.game.data.summonawards.summonawards[_idx].id), Number(cc.game.data.summonawards.summonawards[_idx].count));
                    _itemNode.parent = this.summonShow.getChildByName('award');
                    _itemNode.setPosition(0, 0);
                    _itemNode.runAction(cc.moveTo(0.5, cc.p(-270 + i % 5 * 130, -40 + Math.floor(i / 5) * 120)));
                    this.statisticsAwards(Number(cc.game.data.summonawards.summonawards[_idx].id), Number(cc.game.data.summonawards.summonawards[_idx].count));
                    //node.setPosition(-200 + i % 5 * 100, -40 + Math.floor(i/5) * 70);
                }
                break;
        }
    },

    statisticsAwards: function statisticsAwards(pId, pCount) {
        // cc.log('statisticsAwards1', this.awards.length, this.awards);
        var ref = false;
        for (var i in this.awards) {
            if (this.awards[i] && this.awards[i].id === pId) {
                this.awards[i].count += pCount;
                ref = true;
                break;
            }
        }
        if (!ref) {
            this.awards.push({ id: pId, count: pCount });
        }
        // cc.log('statisticsAwards2', this.awards.length, this.awards);
    },
    createAwardItem: function createAwardItem(pId, pCount) {
        var node = cc.instantiate(this.prefabItem);
        //道具数量
        node.getChildByName('number').getComponent(cc.Label).string = pCount;
        //更换ICON贴图
        node.getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.items.getSpriteFrame(cc.game.data.items.items[pId].icon);
        //更换背景框贴图 ??
        var urlstr = 'itemframe' + cc.game.commonMethod.quality222Number(cc.game.data.items.items[pId].quality);
        node.getChildByName('frame').getComponent(cc.Sprite).spriteFrame = cc.game.spriteCache.itemframe.getSpriteFrame(urlstr);
        //如果是碎片需要显示碎片标志
        if (cc.game.commonMethod.checkIsPatch(cc.game.data.items.items[pId].type)) {
            node.getChildByName('patch').active = true;
        } else {
            node.getChildByName('patch').active = false;
        }
        return node;
    },


    createAwardNode: function createAwardNode(type, str) {
        var node = new cc.Node('award' + str);
        var label = node.addComponent(cc.Label);
        label.string = '' + str;
        type === 1 ? label.fontSize = 40 : label.fontSize = 25;
        return node;
    },

    closeSummonShow: function closeSummonShow() {
        this.summonShow.active = false;
        this.summonShow.getChildByName('award').removeAllChildren();
        this.awards = [];
    },

    // called every frame, uncomment this function to activate update callback
    // update: function (dt) {

    // },

    checkResEnough: function checkResEnough(data) {
        var node = cc.find('Canvas');
        var scr = node.getComponent('town_main');
        var ref = false;
        if (scr) {
            ref = scr.checkResEnough(data);
        } else {
            cc.log('town_summon checkResEnough false');
        }
        return ref;
    },

    checkResEnoughForUI: function checkResEnoughForUI(node, data) {
        if (!this.checkResEnough(data)) {
            node.color = cc.Color.RED;
        } else {
            node.color = cc.Color.WHITE;
        }
    }
});

cc._RF.pop();
},{"dataManager":"dataManager"}],"wild_camera":[function(require,module,exports){
"use strict";
cc._RF.push(module, '350cdPUq0FFXZysAI52Iiz+', 'wild_camera');
// Script/wild/wild_camera.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        hero: cc.Node,
        bg: cc.Node
    },

    // use this for initialization
    onLoad: function onLoad() {
        cc.log('wild_camera_onload');
        var winSize = cc.winSize;
        this.screenMiddle = cc.v2(winSize.width / 2, winSize.height / 2);

        this.boundingBox = cc.rect(-480, -320, this.bg.width, this.bg.height);
        this.minx = -(this.boundingBox.xMax - winSize.width);
        this.maxx = -this.boundingBox.xMin;
        this.miny = -(this.boundingBox.yMax - winSize.height);
        this.maxy = -this.boundingBox.yMin;

        //为了保证切换到城镇界面后野外逻辑正常执行
        cc.game.addPersistRootNode(this.node);
    },

    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {

        var pos = this.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
        var heroPos = this.hero.convertToWorldSpaceAR(cc.Vec2.ZERO);
        var dif = pos.sub(heroPos);

        var dest = dif.add(this.screenMiddle);

        dest.x = cc.clampf(dest.x, this.minx, this.maxx);
        dest.y = cc.clampf(dest.y, this.miny, this.maxy);

        this.node.position = this.node.parent.convertToWorldSpaceAR(dest);
    }
});

cc._RF.pop();
},{}],"wild_control":[function(require,module,exports){
"use strict";
cc._RF.push(module, '11cfd3rFOxMrJIMOodBlhIl', 'wild_control');
// Script/wild/wild_control.js

'use strict';

var dataManager = require('dataManager');
var battleBasic = require('battle_basic');
var heroFsm = new StateMachine({
    data: {
        heroDirector: null
    },
    transitions: [{ name: 'toStart', from: 'none', to: 'idle' }, { name: 'search', from: 'idle', to: 'searchEnded' }, { name: 'moveToEvent', from: 'searchEnded', to: 'movedToEvent' }, { name: 'dealEvent', from: 'movedToEvent', to: 'eventEnd' }, { name: 'reStart', from: 'eventEnd', to: 'idle' }],
    methods: {
        onIdle: function onIdle() {
            setTimeout(function () {
                heroFsm.search();
            }, 100);
        },
        onSearch: function onSearch() {
            //cc.log('onSearch:');
            heroDirector.searching();
        },
        onMoveToEvent: function onMoveToEvent() {
            //cc.log('onMoveToEvent:');
            var heroPos = heroDirector.node.convertToWorldSpaceAR(cc.Vec2.ZERO);
            var eventPos = cc.game.randomEventSprite.convertToWorldSpaceAR(cc.Vec2.ZERO);
            var callFunc = cc.callFunc(function () {
                heroDirector.moveDirection = null;
                heroFsm.dealEvent();
            });
            heroDirector.moveDirection = -1;
            heroDirector.heroMove(heroDirector.node, { length: eventPos.sub(heroPos), callFunc: callFunc });
        },
        onDealEvent: function onDealEvent() {
            //cc.log('onDealEvent:');

            heroDirector.dealingRandomEvent();
        },
        setResult: function setResult(ref) {
            cc.game.infor.battleResult = ref;
        },
        onEnterState: function onEnterState(lifecycle) {
            // cc.log('hero state:' + lifecycle.to);
        }
    }
});

var heroDirector = null;
var Angle = [cc.v2(0, 1), cc.v2(0.7, 0.7), cc.v2(1, 0), cc.v2(0.7, -0.7), cc.v2(0, -1), cc.v2(-0.7, -0.7), cc.v2(-1, 0), cc.v2(-0.7, 0.7)];
var WildRandomEventKindName = ['', 'collect', 'occupy', 'battle'];

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        speed: 0,

        moveDuration: 0,
        searchMaxTimes: 0,
        searchDuration: 0,
        logText: cc.Label,
        collectPer: 0,
        occupyPer: 0,
        battlePer: 0,
        progressing: cc.Prefab,
        collectDuration: 0,
        occupyDuration: 0
    },

    // use this for initialization
    onLoad: function onLoad() {

        cc.game.wildCtrl = this;
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.on(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);

        this.moveDirection = null;

        heroDirector = this;

        this.serchCount = 0;
        this.serchProbability = 0;
        this.idleMoveCount = 0;
        this.moveAngleX = 0;
        this.moveAngleY = 0;
        cc.game.randomEventSprite = null; //随机事件类型存在tag中 0无1采集2占领3战斗
        this.progressBar = null;
    },

    start: function start() {
        heroFsm.toStart();
    },

    destroy: function destroy() {
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_DOWN, this.onKeyDown, this);
        cc.systemEvent.off(cc.SystemEvent.EventType.KEY_UP, this.onKeyUp, this);
    },

    onKeyDown: function onKeyDown(event) {
        this.moveDirection = event.keyCode;
    },

    onKeyUp: function onKeyUp(event) {
        if (event.keyCode === this.moveDirection) {
            this.moveDirection = null;
        }
    },

    // called every frame, uncomment this function to activate update callback
    update: function update(dt) {
        switch (this.moveDirection) {
            case cc.KEY.left:
                this.node.x -= this.speed;
                break;
            case cc.KEY.right:
                this.node.x += this.speed;
                break;
            case cc.KEY.up:
                this.node.y += this.speed;
                break;
            case cc.KEY.down:
                this.node.y -= this.speed;
                break;

            case 0:case 1:case 2:case 3:case 4:case 5:case 6:case 7:
                this.node.x += this.speed * Angle[this.moveDirection].x * 0.7;
                this.node.y += this.speed * Angle[this.moveDirection].y * 0.7;
                break;
        }
    },

    searching: function searching() {
        var _this = this;

        var res = false;
        var callback = null;
        if (this.idleMoveCount >= 2) {
            res = this.searchRandomEvent();
        }
        if (res) {
            setTimeout(function () {
                _this.moveDirection = null;
                _this.idleMoveCount = 0;
                //cc.log('searching:callFunc');
                heroFsm.moveToEvent();
            }, this.moveDuration * 1000);
        } else {
            setTimeout(function () {
                ++_this.idleMoveCount;
                _this.searching();
            }, this.moveDuration * 1000);
        }

        var winSize = cc.winSize;
        var pos = this.node.getPosition();
        var index = 0;
        var final = cc.v2(0, 0);
        var bgSize = this.node.parent.getChildByName('bg').getContentSize();

        index = this.getMoveAngle();

        this.moveDirection = index;
        this.logText.string = '(num=' + this.idleMoveCount + ':' + index + ')';
        this.moveAngleX += Angle[index].x;
        this.moveAngleY += Angle[index].y;
        //cc.log('searching:', index);
    },

    getMoveAngle: function getMoveAngle() {
        var idx = -1;

        if (this.moveAngleX >= 1.4) {
            if (this.moveAngleY >= 1.4) {
                idx = 5;
            } else if (this.moveAngleY <= -1.4) {
                idx = 7;
            } else {
                idx = Math.round(Math.random() * 2) + 5;
            }
        } else if (this.moveAngleX <= -1.4) {
            if (this.moveAngleY >= 1.4) {
                idx = 3;
            } else if (this.moveAngleY <= -1.4) {
                idx = 1;
            } else {
                idx = Math.round(Math.random() * 2) + 1;
            }
        } else {
            if (this.moveAngleY >= 1.4) {
                idx = Math.round(Math.random() * 2) + 3;
            } else if (this.moveAngleY <= -1.4) {
                idx = Math.round(Math.random() * 1) + 0;
            } else {
                idx = Math.floor(Math.random() * (Angle.length - 1));
            }
        }
        return idx;
    },

    searchRandomEvent: function searchRandomEvent() {
        var per = this.serchProbability === 0 ? this.serchProbability = 1 / this.searchMaxTimes : this.serchProbability += 1 / this.searchMaxTimes;
        var rand = Math.random();
        if (rand <= per) {
            this.createRandomEvent();
            return true;
        }
        return false;
    },

    createRandomEvent: function createRandomEvent() {

        //计算随机事件种类
        var rand = Math.random();
        var flag = 0;
        //this.collectPer
        //cc.log('createRandomEvent', rand, );
        if (rand <= parseFloat(cc.game.data.wildaward.collect[0].chance)) {
            flag = 1;
        } else if (rand <= parseFloat(cc.game.data.wildaward.collect[0].chance) + parseFloat(cc.game.data.wildaward.occupy[0].chance)) {
            //this.occupyPer
            flag = 2;
        } else {
            flag = 3;
        }
        //??
        flag = 3;
        cc.game.randomEventSprite = this.createRandomEventSprite(flag);
        var par = this.node.parent.getChildByName('bg');
        cc.game.randomEventSprite.parent = par;
        cc.game.randomEventSprite.setPosition(this.calcRandomEventPos());
    },

    createRandomEventSprite: function createRandomEventSprite(flag) {
        var node = new cc.Node('randomEvent');
        node.scale = 1.5;
        node.anchorX = 0.5;
        node.anchorY = 0.5;
        node.tag = flag;
        var sprite = node.addComponent(cc.Sprite);
        sprite.sizeMode = cc.Sprite.SizeMode.RAW;

        var str = 'ui/' + cc.game.data.wildaward[WildRandomEventKindName[flag]][0].icon;
        //??
        cc.loader.loadRes(str, cc.SpriteFrame, function (err, SpriteFrame) {
            sprite.spriteFrame = SpriteFrame;
        });
        return node;
    },

    calcRandomEventPos: function calcRandomEventPos() {
        var pos = this.node.parent.getPosition();
        //cc.log('calcRandomEventPos:', pos.x, pos.y);
        return cc.v2(pos.x, pos.y);
    },

    dealingRandomEvent: function dealingRandomEvent() {
        // cc.log('dealingRandomEvent:');
        switch (cc.game.randomEventSprite.tag) {
            case 1:
                //采集
                //cc.log('dealingRandomEvent1111:');
                //this.collectDuration
                this.createProgressBar(parseFloat(cc.game.data.wildaward.collect[0].duration));
                break;
            case 2:
                //占领
                //cc.log('dealingRandomEvent2222:');
                //this.occupyDuration
                this.createProgressBar(parseFloat(cc.game.data.wildaward.occupy[0].duration));
                break;
            case 3:
                //战斗
                //cc.log('dealingRandomEvent3333:');
                //  setTimeout(() =>{
                //     cc.loader.loadRes('ui/randomEventHole'+cc.game.randomEventSprite.tag, cc.SpriteFrame, (err, SpriteFrame) =>{
                //         cc.game.randomEventSprite.getComponent(cc.Sprite).spriteFrame = SpriteFrame;
                //     });
                //     heroFsm.reStart();
                //  }, 2000);

                //检测野外场景当前是否显示 如果野外场景 则进入战斗画面 否则直接计算结果
                if (cc.director.getScene().name === 'wild') {
                    cc.game.infor.skipBattle = false;
                    //进入战斗场景??
                    cc.audioEngine.stopAll();
                    cc.director.loadScene('battle');

                    //将野外场景中常驻节点隐藏
                    var node = cc.find('wildroot');
                    node.opacity = 0;
                    break;
                } else {
                    cc.game.infor.skipBattle = true;
                    battleBasic.calcBattleResult();
                    break;
                }

        }
        //发奖励
    },

    battleEnd: function battleEnd() {
        var self = this;
        cc.loader.loadRes('ui/randomEventHole' + cc.game.randomEventSprite.tag, cc.SpriteFrame, function (err, SpriteFrame) {
            cc.game.randomEventSprite.getComponent(cc.Sprite).spriteFrame = SpriteFrame;
        });
    },


    createProgressBar: function createProgressBar(dt) {
        // cc.log('createProgressBar');
        this.progressBar = cc.instantiate(this.progressing);

        var label = this.progressBar.getChildByName('label');
        label.getComponent(cc.Label).string = '0%';

        var bar = this.progressBar.getChildByName('bar');
        bar.progress = 0;

        this.progressBar.parent = cc.game.randomEventSprite;
        this.progressBar.setPosition(-this.progressBar.getContentSize().width / 2, 70);
        this.progressDuration = dt;
        this.progressTime = 0;

        this.schedule(this.progressUpdate, 1);
    },

    progressUpdate: function progressUpdate(dt) {
        //cc.log('progressUpdate');
        this.progressTime += dt;

        if (this.progressTime < this.progressDuration) {
            var per = parseInt(this.progressTime / this.progressDuration * 100);
            this.progressBar.getChildByName('label').getComponent(cc.Label).string = per + '%';
            this.progressBar.getComponent(cc.ProgressBar).progress = per / 100;
        } else {
            this.unschedule(this.progressUpdate);
            this.progressBar.getChildByName('label').getComponent(cc.Label).string = '100%';
            this.progressBar.getComponent(cc.ProgressBar).progress = 1;

            this.randomEventAward();

            this.progressClean();
        }
    },

    randomEventAward: function randomEventAward() {
        switch (cc.game.randomEventSprite.tag) {
            // case 1:
            //     dataManager.changeData({type: 'gold', value: 2000});
            //     break;
            // case 2:
            //     dataManager.changeData({type: 'rmb', value: 100});
            //     break;

            case 1:case 2:
                var num = cc.game.commonMethod.randomAwardKind(cc.game.data.wildaward[WildRandomEventKindName[cc.game.randomEventSprite.tag]][0].award);
                // cc.log('randomEventAward', num);
                cc.game.commonMethod.grantAwards(cc.game.data.wildaward[WildRandomEventKindName[cc.game.randomEventSprite.tag]][0].award[num]);
                break;
        }
    },

    progressClean: function progressClean() {
        var _this2 = this;

        var holdAction = cc.moveBy(0.8, cc.p(0, 0));
        var hideAction = cc.fadeOut(0.5);
        var callback = cc.callFunc(function () {
            _this2.progressBar.destroy();
            cc.loader.loadRes('ui/randomEventHole' + cc.game.randomEventSprite.tag, cc.SpriteFrame, function (err, SpriteFrame) {
                cc.game.randomEventSprite.getComponent(cc.Sprite).spriteFrame = SpriteFrame;
            });
            heroFsm.reStart();
        });
        this.progressBar.runAction(cc.sequence(holdAction, hideAction, callback));
    },

    heroMove: function heroMove(target, data) {
        // cc.log('heroMove:');
        var time = 5;
        var move = cc.moveBy(time, cc.p(data.length.x, data.length.y));
        if (data.callFunc) {
            var se = cc.sequence(move, data.callFunc);
            this.node.runAction(se);
        } else {
            this.node.runAction(move);
        }
    },

    wildFsmRestart: function wildFsmRestart() {
        setTimeout(function () {
            heroFsm.reStart();
        }, 10);
    }
});

module.exports = heroFsm;

cc._RF.pop();
},{"battle_basic":"battle_basic","dataManager":"dataManager"}],"wild_main":[function(require,module,exports){
"use strict";
cc._RF.push(module, '4e2b5mR2hVKDoaf7Xp6rjUN', 'wild_main');
// Script/wild/wild_main.js

'use strict';

cc.Class({
    extends: cc.Component,

    properties: {
        // foo: {
        //    default: null,      // The default value will be used only when the component attaching
        //                           to a node for the first time
        //    url: cc.Texture2D,  // optional, default is typeof default
        //    serializable: true, // optional, default is true
        //    visible: true,      // optional, default is true
        //    displayName: 'Foo', // optional
        //    readonly: false,    // optional, default is false
        // },
        // ...
        hero: cc.Node,
        moveDuration: 0,
        bg: cc.Node,
        searchMaxTimes: 0,
        searchDuration: 0,
        logText: cc.Label

    },

    // use this for initialization
    onLoad: function onLoad() {
        // wildDirector = this;

        // this.serchCount = 0;
        // this.serchProbability = 0;
        // this.idleMoveCount = 0;
        // this.moveAngleX = 0;
        // this.moveAngleY = 0;

        //wildFsm.toStart();
        //显示野外场景常驻节点
        var wildNode = cc.find('wildroot');
        wildNode.opacity = 255;

        cc.director.preloadScene('town');

        // var node = cc.director.getScene().getChildByName('data');
        // var data = node.getComponent('data').getdata();
        // cc.log('常驻节点的值为:'+data);

        //提示信息屏蔽响应
        cc.game.tipLayout.node.pauseSystemEvents(true);
    }

});

cc._RF.pop();
},{}]},{},["battle_basic","battle_main","battle_player","data","TimelineLite","TweenLite","btn","dialog","login","longin_data","tipLayout","attrview","cheet","clickdown","gotowild","oporateBtn","town_camera","town_main","town_pre","town_summon","dataManager","define","equipjs","loadXML","recordTime","storageManager","gototown","wild_camera","wild_control","wild_main"]);
