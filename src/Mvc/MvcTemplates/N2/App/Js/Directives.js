﻿(function (module) {

	module.filter("translate", function (Translate) {
		return function (fallback, key) {
			if (!key) console.error("No key provided for translation text ", fallback);

			//console.log("translate filter", fallback, key);
			return Translate(key, fallback);
		}
	});

	module.directive("translate", function (Translate) {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				//console.log("TRANSLATE", element[0]);
				if (!attrs.translate) console.error("No key provided for translation element", element[0]);

				var translation = Translate(attrs.translate);
				//console.log("translate directive", attrs.translate, translation);
				if (typeof translation == "string") {
					element.html(translation);
					return;
				}
				for (var key in translation) {
					if (key == "html")
						element.html(translation[key]);
					else if (key == "text") {
						for (var i in element[0].childNodes) {
							var node = element[0].childNodes[i]
							if (node.nodeType == Node.TEXT_NODE && node.nodeValue && node.nodeValue.replace(/\s/g, "")) {
								node.nodeValue = translation[key];
								return;
							}
						}
					}
					else
						element.attr(key, translation[key]);
				}
			}
		}
	});

	module.directive("contextMenuTrigger", function () {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				element.bind("contextmenu", function (e) {
					var clickedElements = $(e.target).closest(".item").find(".dropdown-toggle").trigger("click").length;
					if (clickedElements)
						e.preventDefault();
				});
			}
		}
	});

	var key = { enter: 13, esc: 27, left: 37, up: 38, right: 39, down: 40, del: 46, a: 65, c: 67, n: 78, v: 86, x: 88, z: 90 };

	angular.forEach(["Enter", "Esc", "Down", "Up"], function (k) {
		var name = "n2Key" + k;
		module.directive(name, function () {
			return {
				restrict: "A",
				link: function compile(scope, element, attrs) {
					var code = key[k.toLowerCase()];
					element.bind("keyup", function (e) {
						if (e.keyCode == code) {
							e.preventDefault();
							e.stopPropagation();
							scope.$apply(attrs[name]);
						}
					});
				}
			}
		});
	});

	module.directive("n2Focus", function () {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				scope.$watch(function () {
					return scope.$eval(attrs.n2Focus);
				}, function (focus) {
					if (focus) element.focus();
				});
			}
		}
	});

	module.directive("evaluateHref", function ($interpolate) {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				scope.$watch(attrs.evaluateHref, function (expr) {
					element.attr("href", expr && $interpolate(expr)(scope));
				});
			}
		}
	});

	module.directive("evaluateTitle", function ($interpolate) {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				scope.$watch(attrs.evaluateTitle, function (expr) {
					element.attr("title", expr && $interpolate(expr)(scope));
				});
			}
		}
	});

	module.directive("evaluateInnerHtml", function ($interpolate) {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				scope.$watch(attrs.evaluateInnerHtml, function (expr) {
					console.log("watching", expr, $interpolate(expr)(scope), scope.Context.CurrentItem.Title);
					element.html(expr && $interpolate(expr)(scope));
				});
			}
		}
	});

	module.directive("pageActionLink", function ($interpolate) {
		return {
			restrict: "E",
			replace: true,
			scope: true,
			templateUrl: 'App/Partials/MenuLink.html',
			link: function compile(scope, element, attrs) {
				scope.$watch(attrs.node, function (node) {
					scope.node = node;
					if (node.Current && !node.Current.Target)
						node.Current.Target = "preview";
					if (node.Current && !node.Current.Url && node.Current.PreviewUrl)
						node.Current.Url = node.Current.PreviewUrl;
				});
				scope.evaluateExpression = function (expr) {
					return expr && $interpolate(expr)(scope);
				};
				scope.evalExpression = function (expr) {
					console.log("eval", expr, scope.Context.CurrentItem && scope.Context.CurrentItem.PreviewUrl);
					expr && scope.$eval(expr);
				};
			}
		}
	});

	module.directive("backgroundImage", function () {
		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				scope.$watch(attrs.backgroundImage, function (backgroundImage) {
					if (backgroundImage) {
						var style = element.attr("style");
						if (style)
							style += ";";
						else
							style = "";
						style += "background-image:url(" + backgroundImage + ")";
						element.attr("style", style);
					}
				});
			}
		}
	});

	module.directive("load", function($parse){
		return function (scope, element, attr) {
			var fn = $parse(attr.load);
			element.bind("load", function (e) {
				scope.$apply(function () {
					fn(scope, { $event: e });
				});
			});
		};
	});

	module.directive("keyup", function ($parse) {
		return function (scope, element, attr) {
			var fn = $parse(attr.keyup);
			element.bind("keyup", function (e) {
				scope.$apply(function () {
					fn(scope, { $event: e });
				});
			});
		};
	});

	module.directive("esc", function ($parse) {
		return function (scope, element, attr) {
			var fn = $parse(attr.keyup);
			element.bind("keyup", function (e) {
				if (e.keyCode == 27) {
					scope.$apply(function () {
						fn(scope, { $event: e });
					});
				}
			});
		};
	});

	module.directive("sortable", function () {

		var ctx = {
		};

		return {
			restrict: "A",
			link: function compile(scope, element, attrs) {
				var sort = {
					start: function (e, args) {
						var $from = $(args.item[0]).parent().closest("li");
						ctx = {
							operation: "sort",
							indexes: {
								from: args.item.index()
							},
							scopes: {
								from: $from.length && angular.element($from).scope()
							},
							paths: {
								from: $from.attr("sortable-path") || null
							}
						};
					},
					remove: function (e, args) {
					},
					update: function (e, args) {
					},
					receive: function (e, args) {
						ctx.operation = "move";
					},
					stop: function (e, args) {
						var $selected = $(args.item[0]);
						var $to = $selected.parent().closest("li");

						ctx.paths.selected = $selected.attr("sortable-path") || null;
						ctx.paths.to = $to.attr("sortable-path") || null;
						ctx.paths.before = $selected.next().attr("sortable-path") || null;

						ctx.scopes.selected = $selected.length && angular.element($selected).scope();
						ctx.scopes.to = $to.length && angular.element($to).scope();
						
						ctx.indexes.to = args.item.index();

						ctx.scopes.from.node.Children.splice(ctx.indexes.from, 1);

						var options = scope.$eval(attrs.sortable)

						if (ctx.operation == "move") {
							options.move && options.move(ctx);
						} else {
							options.sort && options.sort(ctx);
						}
						ctx.scopes.from.$digest();
						ctx.scopes.to.$digest();
						ctx = {};
					}
				};

				setTimeout(function () {
					element.sortable({
						connectWith: '.targettable',
						placeholder: 'sortable-placeholder',
						handle: '.handle',
						receive: sort.receive,
						remove: sort.remove,
						update: sort.update,
						start: sort.start,
						stop: sort.stop
					});
				}, 100);
			}
		}
	});

	module.directive('compile', function ($compile) {
		return function (scope, element, attrs) {
			scope.$watch(
				function (scope) {
					// watch the 'compile' expression for changes
					return scope.$eval(attrs.compile);
				},
				function (value) {
					if (value === null)
						return;

					// when the 'compile' expression changes assign it into the current DOM
					element.html(value);

					// compile the new DOM and link it to the current scope.
					// NOTE: we only compile .childNodes so that we don't get into infinite loop compiling ourselves
					$compile(element.contents())(scope);
				}
			);
		};
	});

	angular.forEach(['X', 'Y'], function (dir) {
		module.directive('n2Resize' + dir, function ($parse) {
			return function (scope, element, attrs) {
				var modelGet = $parse(attrs["n2Resize" + dir]);
				var modelSet = modelGet.assign;

				var initialClientValue, initialModelValue;

				element.bind("mousedown", function (e) {
					initialClientValue = e["client" + dir];
					initialModelValue = modelGet(scope);

					$(document).bind("mousemove.n2Resize", function (e) {
						modelSet(scope, initialModelValue + e["client" + dir] - initialClientValue);
						console.log("moving", initialModelValue, "+", e["client" + dir], "-", initialClientValue, "=", initialModelValue + e["client" + dir] - initialClientValue);
						scope.$digest();
					});
					$(document.body).addClass("resizing");
				});
				element.bind("mouseup", function (e) {
					scope.$emit("resized", { direction: dir, from: initialModelValue, to: modelGet(scope)});
					$(document).unbind("mousemove.n2Resize");
					$(document.body).removeClass("resizing");
					initialClientValue = undefined;
					initialModelValue = undefined;
				});
			};
		});
	});

	module.filter('pretty', function () {
		function syntaxHighlight(json) {
			if (typeof json != 'string') {
				json = angular.toJson(json, true);
			}
			json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
			return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
				var cls = 'number';
				if (/^"/.test(match)) {
					if (/:$/.test(match)) {
						cls = 'key';
					} else {
						cls = 'string';
					}
				} else if (/true|false/.test(match)) {
					cls = 'boolean';
				} else if (/null/.test(match)) {
					cls = 'null';
				}
				return '<span class="' + cls + '">' + match + '</span>';
			});
		}
		return function (obj) {
			return "<style>\
span.key {color:blue}\
span.number {color:green}\
span.string {color:red}\
span.boolean {color:green}\
span.null {color:silver}\
</style><pre>" + syntaxHighlight(obj) + "</pre>";
		};
	});

})(angular.module('n2.directives', ['n2.localization']));