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

		# Create an output buffer
		self.output_view = self.window.new_file()
		self.output_view.set_name("Element Finder Results")
		self.output_view.set_scratch(True)
		self.output_view.set_syntax_file("Packages/ElementFinder/Element Finder Results.tmLanguage")
		self.output_view.settings().set("result_file_regex", "^([^ ].*) \([0-9]+ match(?:es)?\)$")

		# Create a thread so that calling the command line app doesn't lock up the interface
		self.thread = CommandLineInterface(self.paths, selector, sublime.load_settings("elfinder.sublime-settings").get("node_path"))
		self.thread.start()
		self.handle_threading()

	def print_line(self, output):
		edit = self.output_view.begin_edit()
		self.output_view.insert(edit, self.output_view.size(), output)
		self.output_view.end_edit(edit)

	def update_status(self, filesProcessed, totalFiles):
		self.output_view.set_status('element_finder', 'Element Finder is searching... (%s/%s files)' % (filesProcessed, totalFiles))

	def handle_threading(self):
		while (len(self.thread.responses) > 0):
			json_line = self.thread.responses.pop(0)

			if "status" in json_line:
				if json_line["status"] == "countedFiles":
					self.update_status(0, json_line["numberOfFiles"])
					self.print_line(json_line["message"] + "\n\n")
					self.print_line("Tip: to fold all result summaries, press Command K 1\n\n")
				elif json_line["status"] == "processingFile":
					self.update_status(json_line["fileNumber"], json_line["numberOfFiles"])
				elif json_line["status"] == "foundMatch":
					output = json_line["file"] + " (" + self.pluralise(json_line["matches"], "match", "matches") + ")\n\n"
					match_number = 1
					for match_detail in json_line["matchesDetails"]:
						output += "    " + str(match_number).ljust(4, " ") + match_detail.replace("\n", "\n        ") + "\n"
						if (match_number == json_line["matches"]):
							output += "\n"
						match_number += 1
					self.print_line(output)
				elif json_line["status"] == "complete":
					self.print_line(json_line["message"] + "\n\n")
				else:
					print "Status: " + json_line["status"]

		if self.thread.complete == True:
			self.output_view.erase_status('element_finder')
		else:
			sublime.set_timeout(self.handle_threading, 100)


class CommandLineInterface(threading.Thread):

	def __init__(self, paths, selector, node):
		self.responses = []
		self.complete = False
		self.paths = paths
		self.selector = selector
		self.node = node
		threading.Thread.__init__(self)

	def run(self):

		# Create a Subprocess to call the command line app
		# http://docs.python.org/library/subprocess.html#subprocess.Popen
		self.sp = subprocess.Popen(
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
		for line in iter(self.sp.stdout.readline, ""):
			self.processLine(line)

		for err in iter(self.sp.stderr.readline, ""):
			self.processLine(err)
			self.sp.terminate()

		self.sp.wait()

	# Process the JSON response from elfinder
	def processLine(self, line):

		try:
			json_line = json.loads(line)
		except ValueError:
			if (len(line.strip()) > 0):
				self.sp.terminate()
				self.complete = True
				sublime.error_message("Invalid response from elfinder CLI: " + line)
				return

		self.responses.append(json_line)

		if "status" in json_line:
			if json_line["status"] == "complete":
				self.complete = True
