import sublime, sublime_plugin, subprocess, threading, json

# Note: this code has been written to run with elfinder v.0.0.2
# https://github.com/keeganstreet/element-finder

class ElementFinderCommand(sublime_plugin.WindowCommand):

	# This method is called when the user right-clicks files/folders in the Side Bar and selects "Find Selector in Files"
	def run(self, paths = []):

		# Save the files/folders that were selected into an array
		self.paths = paths

		# Ask the user what CSS Selector they want to search for
		self.window.show_input_panel("Find CSS Selector:", "", self.on_css_selector_entered, None, None)

	def pluralise(self, number, singular, plural):
		if number == 1:
			return str(number) + " " + singular
		else:
			return str(number) + " " + plural

	# This method runs after the user enters a CSS Selector
	def on_css_selector_entered(self, selector):

		# Create a thread so that calling the command line app doesn't lock up the interface
		self.thread = CommandLineInterface(self.paths, selector, sublime.load_settings("elfinder.sublime-settings").get("node_path"))
		self.thread.start()
		self.handle_threading()

	def handle_threading(self):
		if self.thread.complete == True:
			output = "Found " + str(self.thread.total_matches) + " matches in " + str(self.thread.files_with_matches) + " files.\n\n"
			for file in self.thread.files:
				output += file["file"] + " (" + self.pluralise(file["matches"], "match", "matches") + ")\n\n"

			results_view = self.window.new_file()
			results_view.set_name("Element Finder Results")
			results_view.set_scratch(True)
			results_view.set_syntax_file("Packages/ElementFinder/Element Finder Results.tmLanguage")
			results_view.settings().set("result_file_regex", "^([^ ].*) \([0-9]+ match(?:es)?\)$")
			edit = results_view.begin_edit()
			results_view.insert(edit, results_view.size(), output)
			results_view.end_edit(edit)
		else:
			sublime.set_timeout(self.handle_threading, 100)


class CommandLineInterface(threading.Thread):

	def __init__(self, paths, selector, node):
		self.files = []
		self.complete = False
		self.paths = paths
		self.selector = selector
		self.node = node
		threading.Thread.__init__(self)

	def run(self):

		# Create a Subprocess to call the command line app
		# http://docs.python.org/library/subprocess.html#subprocess.Popen
		sp = subprocess.Popen(
			[
				self.node,
				sublime.packages_path() + "/ElementFinder/lib/elfinder/element-finder.js",
				"--json",
				"--selector", self.selector
			],
			bufsize = -1,
			stdout = subprocess.PIPE,
			stderr = subprocess.PIPE,
			stdin = subprocess.PIPE,
			cwd = self.paths[0])

		# Poll process for new output until finished
		for line in iter(sp.stdout.readline, ""):
			self.processLine(line)

		for err in iter(sp.stderr.readline, ""):
			self.processLine(err)

		sp.wait()

	# Process the JSON response from elfinder
	def processLine(self, line):

		try:
			json_line = json.loads(line)
		except ValueError:
			sublime.error_message("Invalid response from elfinder: " + line)
			return

		if "status" in json_line:
			if json_line["status"] == "foundMatch":
				self.files.append(json_line)
			elif json_line["status"] == "complete":
				self.complete = True
				self.total_matches = json_line["totalMatches"]
				self.files_with_matches = json_line["numberOfFilesWithMatches"]
			else:
				print "Status: " + json_line["status"]


