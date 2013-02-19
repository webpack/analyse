var d3 = require("d3");
module.exports = function(stats, element) {
	var modulesMap = {};
	stats.modules.forEach(function(m) {
		modulesMap[m.id] = m;
		m.requires = [];
	});
	(function reverseReasons(modules) {
		modules.forEach(function(m) {
			m.reasons.forEach(function(r) {
				var module = r._module = modulesMap[r.moduleId];
				module.requires.push({
					moduleId: m.id,
					module: m.name,
					_module: m,
					type: r.type,
					loc: r.loc
				});
			});
		});
	}(stats.modules));
	function getOrgModules(modules) {
		return modules.map(function(m) {
			return modulesMap[m.id];
		});
	}
	
	var chunksMap = {};
	stats.chunks.forEach(function(c) {
		chunksMap[c.id] = c;
		c.childrenChunks = [];
	});
	(function reverseParents(chunks) {
		chunks.forEach(function(c) {
			c.parents.forEach(function(p) {
				chunksMap[p].childrenChunks.push(c.id);
			});
		});
	}(stats.chunks));
	
	
	var template = require("./stats.jade");
	var Stats = require("webpack/lib/Stats");
	element.html(template({
		stats: stats,
		statsOutput: Stats.jsonToString(stats)
	}));
	var moduleView = $("#module-view");
	var moduleViewContent = $("#module-view-content");
	var chunkView = $("#chunk-view");
	var chunkViewContent = $("#chunk-view-content");
	initModules(element);
	function initModules(content) {
		content.find(".module-row.has-reasons").popover({
			html: true,
			placement: "bottom",
			trigger: "hover",
			title: "Reasons",
			content: function() {
				var reasons = $(this).find(".module-reasons");
				return reasons.html();
			}
		});
	}
	element.find(".open-module").click(openModule);
	element.find(".open-chunk").click(openChunk);
	function openModule() {
		var me = $(this);
		require.ensure([], function(require) {
			var moduleId = parseInt(me.data("module"), 10);
			var module = null;
			for(var i = 0; i < stats.modules.length; i++) {
				if(stats.modules[i].id == moduleId) {
					module = stats.modules[i];
					break;
				}
			}
			if(!module) return false;
			moduleView.parent().removeClass("hide");
			var template = require("./module-view.jade");
			var content = moduleViewContent.html(template({module: module}));
			content.find(".open-module").click(openModule);
			content.find(".open-chunk").click(openChunk);
			modulesGraph(".module-reasons-graph", [module]);
			moduleView.text("Module " + module.name).tab("show");
		});
		return false;
	}
	function openChunk() {
		var me = $(this);
		require.ensure([], function(require) {
			var chunkId = parseInt(me.data("chunk"), 10);
			var chunk = null;
			for(var i = 0; i < stats.chunks.length; i++) {
				if(stats.chunks[i].id == chunkId) {
					chunk = stats.chunks[i];
					break;
				}
			}
			if(!chunk) return false;
			chunkView.parent().removeClass("hide");
			var template = require("./chunk-view.jade");
			var content = chunkViewContent.html(template({chunk: chunk, stats: stats}));
			content.find(".open-module").click(openModule);
			content.find(".open-chunk").click(openChunk);
			initModules(content);
			modulesGraph(".chunk-modules-graph", getOrgModules(chunk.modules));
			chunkView.text("Chunk " + chunk.id).tab("show");
		});
		return false;
	}
	(function assetsGraph() {
		var width = 800, height = 600;
		var color = d3.scale.category20c();
		var bubble = d3.layout.pack()
			.sort(null)
			.size([width, height])
			.padding(3)
			.value(function(d) {
				return d.size;
			});
		var svg = d3.select(".assets-graph")
			.attr("width", width)
			.attr("height", height);
		var node = svg.selectAll(".node")
			.data(bubble.nodes({children: stats.assets}).filter(function(d) { return !d.children; }))
			.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		node.append("title")
			.text(function(d) { return d.name; });
		node.append("circle")
			.attr("r", function(d) { return d.r; })
			.style("fill", function(d) { return color(d.name); });
		node.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) { return d.name.substr(0, d.r / 3); });
	}());
	function modulesGraph(selector, orgModules) {
		var modules = orgModules.slice();
		var links = [];
		orgModules.forEach(function(m) {
			m.reasons.forEach(function(r) {
				if(modules.indexOf(r._module) < 0)
					modules.push(r._module);
			});
			m.requires.forEach(function(r) {
				if(modules.indexOf(r._module) < 0)
					modules.push(r._module);
			});
		});
		modules.forEach(function(m) {
			m.reasons.forEach(function(r) {
				if(modules.indexOf(r._module) >= 0) {
					links.push({
						source: m,
						target: r._module
					});
				}
			});
		});
		links.forEach(function(l) {
			l.strength = Math.min(10, l.target.reasons.length / (l.source.reasons.length+1));
		});
		var width = 800, height = 600;
		var color = d3.scale.category20c();
		var force = d3.layout.force()
			.charge(-120)
			.linkDistance(30)
			.size([width, height])
			.nodes(modules)
			.links(links)
			.linkStrength(function(d) {
				return d.strength;
			})
			.start();
			
		var svg = d3.select(selector)
			.attr("width", width)
			.attr("height", height);
			
		var link = svg.selectAll(".link")
			.data(links)
			.enter().append("line")
			.attr("class", "link");
			
		link.attr("stroke", "#ccc")
			.attr("stroke-width", function(d) {
				return Math.min(d.strength*3, 10) + 1;
			});

		var node = svg.selectAll(".node")
			.data(modules)
			.enter().append("g")
			.attr("class", "node")
			.call(force.drag);
		
		node.append("circle")
			.attr("r", 10)
			.style("fill", function(d) { return color(d.chunks.join()); });
		
		node.append("text")
			.attr("dy", ".3em")
			.style("fill", "#000")
			.style("text-anchor", "middle")
			.text(function(d) { return d.id; });
		
		node.append("title")
			.text(function(d) { return d.name; });
		
		force.on("tick", function() {
			link.attr("x1", function(d) { return d.source.x; })
				.attr("y1", function(d) { return d.source.y; })
				.attr("x2", function(d) { return d.target.x; })
				.attr("y2", function(d) { return d.target.y; });

			node.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		});
	}
	modulesGraph(".modules-graph", stats.modules);
	(function chunksGraph() {
		var width = 800, height = 600;
		var color = d3.scale.category20c();
		var bubble = d3.layout.pack()
			.sort(null)
			.size([width, height])
			.padding(3)
			.value(function(d) {
				return d.size;
			})
			.children(function(d) {
				return d.modules;
			});
		stats.chunks.forEach(function(c) {
			c.modules.forEach(function(m) {
				m.loaders = m.name.split("!");
				m.loaders.pop();
				m.loaders = m.loaders.join("!");
				m.chunk = c;
			});
		});
		var svg = d3.select(".chunks-graph")
			.attr("width", width)
			.attr("height", height);
		var node = svg.selectAll(".node")
			.data(bubble.nodes({modules: stats.chunks}).filter(function(d) { return d.depth > 0; }))
			.enter().append("g")
			.attr("class", "node")
			.attr("transform", function(d) { return "translate(" + d.x + "," + d.y + ")"; });
		node.append("title")
			.text(function(d) { return d.name || d.files.join(", "); });
		node.append("circle")
			.attr("r", function(d) { return d.r; })
			.style("fill", function(d) { return d.modules ? "transparent" : color(d.loaders); })
			.style("stroke", function(d) { return d.modules ? "#ccc" : "transparent"; })
			.style("stroke-width", function(d) { return d.modules ? 2 : 0; });
		node.append("text")
			.attr("dy", ".3em")
			.style("text-anchor", "middle")
			.text(function(d) {
				if(d.name && d.name.length <= d.r / 3) return d.name;
				if(d.r >= 3 && d.r < 6 && d.id < 10) return d.id + "";
				if(d.r >= 6 && d.r < 9 && d.id < 100) return d.id + "";
				if(d.r >= 9 && d.id < 1000) return d.id + "";
				return "";
				// return (d.name || d.id + "").substr(0, d.r / 3); 
			});
	}());
}