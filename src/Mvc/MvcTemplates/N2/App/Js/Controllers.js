﻿angular.module('n2', ['n2.routes', 'n2.directives', 'n2.services'], function () {
	console.log("controllers.js");
});

function ManagementCtrl($scope, Interface, Context, $window) {
	
	$scope.Interface = Interface.get({
		view: window.location.search.match(/[?&]view=([^?&]+)/)[1],
		selected: window.location.search.match(/[?&]selected=([^?&]+)/)[1],
	});
	$scope.Context = {
		Node: {
			Current: {
				PreviewUrl: "Empty.aspx"
			}
		}
	}
	$scope.$watch("Context.Node.Current.Path", function (path) {
		if (path) {
			var item = $scope.Context.Node.Current;
			Context.get({ selected: item.Path }, function (ctx) {
				angular.extend($scope.Context, ctx);
			});
		}
	});
}
function SearchCtrl() {
}
function NavigationCtrl($scope) {
	$scope.$watch("Interface.User.PreferredView", function (view) {
		$scope.viewPreference = view == 0
			? "draft"
			: "published";
	});
}
function TrunkCtrl($scope) {
	$scope.$watch("Interface.Content", function (content) {
		$scope.node = content;
		if (content)
			$scope.Context.Node = findSelectedRecursive(content);
	});
	$scope.toggle = function (node) {
		node.Expanded = !node.Expanded;
	};
	function findSelectedRecursive(node) {
		if (node.Selected) {
			return node;
		}
		for (var i in node.Children) {
			var n = findSelectedRecursive(node.Children[i]);
			if (n) return n;
		}
		return null;
	}
	$scope.select = function (node) {
		$scope.Context.Node.Selected = false;
		$scope.Context.Node = node;
		node.Selected = true;
	}
}
function BranchCtrl($scope, Children) {
	$scope.node = $scope.child;
	$scope.toggle = function (node) {
		console.log(node);
		if (!node.Expanded && !node.Children.length) {
			node.Children = Children.query({ selected: node.Current.Path });
		}
		node.Expanded = !node.Expanded;
	};
}
function PageActionCtrl($scope, $interpolate) {
	$scope.evaluateExpression = function (expr) {
		return expr && $interpolate(expr)($scope);
	};
}
function LanguageCtrl($scope, Translations) {
	$scope.onOver = function (node) {
		if (node.Children.length && node.Selected == node.Current.Path)
			return;
		node.Selected = node.Current.Path;
		node.Loading = true;
		node.Children = Translations.query({ selected: node.Current.Path }, function () {
			node.Loading = false;
		});
	}
}

function VersionsCtrl($scope, Versions) {
	$scope.onOver = function (node) {
		if (node.Children.length && $scope.Selected == node.Current.Path)
			return;
		$scope.Selected = node.Current.Path;
		node.Loading = true;
		node.Children = Versions.query({ selected: node.Current.Path }, function (versions) {
			node.Loading = false;
		});
	}
}