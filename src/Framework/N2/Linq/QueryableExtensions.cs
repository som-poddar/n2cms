﻿using System;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace N2.Linq
{
	public static class QueryableExtensions
	{
		public static IQueryable<TSource> WherePublished<TSource>(this IQueryable<TSource> source) where TSource : ContentItem
		{
			var time = Utility.CurrentTime();
			return source.Where(ci => ci.State == ContentState.Published 
				&& (ci.Published != null && ci.Published <= time) 
				&& (ci.Expires == null || ci.Expires < time));
		}

		public static IQueryable<TSource> WhereDescendantOf<TSource>(this IQueryable<TSource> source, ContentItem ancestor) where TSource : ContentItem
		{
			return source.Where(ci => ci.AncestralTrail.StartsWith(ancestor.GetTrail()));
		}

		public static IQueryable<TSource> WhereDescendantOrSelf<TSource>(this IQueryable<TSource> source, ContentItem ancestor) where TSource : ContentItem
		{
			return source.Where(ci => ci.AncestralTrail.StartsWith(ancestor.GetTrail()) || ci == ancestor);
		}

		public static IQueryable<TSource> WherePage<TSource>(this IQueryable<TSource> source, bool isPage = true) where TSource : ContentItem
		{
			if (isPage)
				return source.Where(ci => ci.ZoneName == null);
			else
				return source.Where(ci => ci.ZoneName != null);
		}

		static MethodInfo whereMethodInfo = typeof(Queryable).GetMethods().First(m => m.Name == "Where" && m.GetParameters().Length == 2).GetGenericMethodDefinition();
		
		public static IQueryable<TSource> WhereDetail<TSource>(this IQueryable<TSource> source, Expression<Func<TSource, bool>> predicate) where TSource : ContentItem
		{
			var whereOfT = whereMethodInfo.MakeGenericMethod(new Type[] { typeof(TSource) });
			var transformedExpression = new QueryTransformer().ToDetailSubselect<TSource>(predicate);
			var whereDetailSubselectExpression = Expression.Call(whereOfT, source.Expression, transformedExpression);
			return source.Provider.CreateQuery<TSource>(whereDetailSubselectExpression);
		}

		public static IQueryable<T> WhereDetailEquals<T, TValue>(this IQueryable<T> query, TValue value) where T : ContentItem
		{
			var queryByName = query.Where(
				StringComparison<T>(null, value as string)
				?? ContentItemComparison<T>(null, value as ContentItem)
				?? IntegerComparison<T>(null, value as int?)
				?? DateTimeComparison<T>(null, value as DateTime?)
				?? BooleanComparison<T>(null, value as bool?)
				?? DoubleComparison<T>(null, value as double?)
				?? UnknownValueType<T>(null, value));

			return queryByName;
		}

		public static IQueryable<T> WhereDetailEquals<T, TValue>(this IQueryable<T> query, string name, TValue value) where T : ContentItem
		{
			var queryByName = query.Where(
				StringComparison<T>(name, value as string)
				?? ContentItemComparison<T>(name, value as ContentItem)
				?? IntegerComparison<T>(name, value as int?)
				?? DateTimeComparison<T>(name, value as DateTime?)
				?? BooleanComparison<T>(name, value as bool?)
				?? DoubleComparison<T>(name, value as double?)
				?? UnknownValueType<T>(name, value));

			return queryByName;
		}

		private static Expression<Func<T, bool>> BooleanComparison<T>(string name, bool? value) where T : ContentItem
		{
			if (value == null)
				return null;

			if (name == null) return (ci) => ci.Details.Any(cd => cd.BoolValue == value.Value);
			return (ci) => ci.Details.Any(cd => cd.Name == name && cd.BoolValue == value.Value);
		}

		private static Expression<Func<T, bool>> IntegerComparison<T>(string name, int? value) where T : ContentItem
		{
			if (value == null)
				return null;

			if (name == null) return (ci) => ci.Details.Any(cd => cd.Name == name && cd.IntValue == value.Value);
			return (ci) => ci.Details.Any(cd => cd.Name == name && cd.IntValue == value.Value);
		}

		private static Expression<Func<T, bool>> DoubleComparison<T>(string name, double? value) where T : ContentItem
		{
			if (value == null)
				return null;

			if (name == null) return (ci) => ci.Details.Any(cd => cd.DoubleValue == value.Value);
			return (ci) => ci.Details.Any(cd => cd.Name == name && cd.DoubleValue == value.Value);
		}

		private static Expression<Func<T, bool>> DateTimeComparison<T>(string name, DateTime? value) where T : ContentItem
		{
			if (value == null)
				return null;

			if (name == null) return (ci) => ci.Details.Any(cd => cd.DateTimeValue == value.Value);
			return (ci) => ci.Details.Any(cd => cd.Name == name && cd.DateTimeValue == value.Value);
		}

		private static Expression<Func<T, bool>> StringComparison<T>(string name, string value) where T : ContentItem
		{
			if (value == null)
				return null;

			if (name == null) return (ci) => ci.Details.Any(cd => cd.StringValue == value);
			return (ci) => ci.Details.Any(cd => cd.Name == name && cd.StringValue == value);
		}

		private static Expression<Func<T, bool>> ContentItemComparison<T>(string name, ContentItem value) where T : ContentItem
		{
			if (value == null)
				return null;

			if (name == null) return (ci) => ci.Details.Any(cd => cd.LinkedItem == value);

			return (ci) => ci.Details.Any(cd => cd.Name == name && cd.LinkedItem == value);
		}

		private static Expression<Func<T, bool>> UnknownValueType<T>(string name, object value) where T : ContentItem
		{
			throw new NotSupportedException(value + " is not supported.");
		}
	}
}
