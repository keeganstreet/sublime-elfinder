import sublime, sublime_plugin, subprocess, threading, json

class ElementFinderCommand(sublime_plugin.WindowCommand):

	# This method is called when the user right-clicks folders in the Side Bar and selects "Find Elements in Folder..."
	def run(self, dirs = [], type = None):

		active_view = self.window.active_view()

		if len(dirs) == 0:
			# Search in the current working directory
			if active_view == None:
				return self.invalid_directory()

			current_file = active_view.file_name()
			if current_file == None:
				return self.invalid_directory()

			# Loop through folders in Side Bar and see which ones contain the current file
			folders_containing_current_file = []
			for folder in self.window.folders():
				if current_file.find(folder) == 0:
					folders_containing_current_file.append(folder)

			if len(folders_containing_current_file) > 0:
				self.dirs = folders_containing_current_file
			else:
				return self.invalid_directory()

		else:
			# Search in the folders that were selected in the Side Bar
			self.dirs = dirs

		# If the user has text selected, use that as search input
		initial_text = ""
		if active_view != None:
			selections = active_view.sel()
			if len(selections) > 0:
				initial_text = active_view.substr(selections[0])

		# Ask the user what CSS Selector they want to search for
		self.window.show_input_panel("Find elements matching CSS selector:", initial_text, self.on_css_selector_entered, None, None)

	def invalid_directory(self):
		sublime.error_message("Element Finder doesn't know which directory to search in. Right-click a folder in the Side Bar and select 'Find Elements in Folder...'.")

	def pluralise(self, number, singular, plural):
		if number == 1:
			return str(number) + " " + singular
		else:
			return str(number) + " " + plural

	# This method runs after the user enters a CSS Selector
	def on_css_selector_entered(self, selector):

		# Create an output buffer
		self.output_view = self.window.new_file()
		self.output_view.set_name(selector + " - Element Finder Results")
		self.output_view.set_scratch(True)
		self.output_view.set_syntax_file("Packages/Element Finder/Element Finder Results.tmLanguage")
		self.output_view.settings().set("result_file_regex", "^([^ ].*) \([0-9]+ match(?:es)?\)$")
		self.output_view.settings().set("result_line_regex", "^ +([0-9]+): ")

		# Create a thread so that calling the command line app doesn't lock up the interface
		sublime_settings = sublime.load_settings("Element Finder.sublime-settings")
		settings = {
			"node_path" : sublime_settings.get("node_path"),
			"extension" : sublime_settings.get("extension"),
			"ignore" : sublime_settings.get("ignore")
		}

		# Let the user declare different Node paths for each OS, in case they sync the plugin across multiple computers
		if (sublime.platform() == "osx" and sublime_settings.get("node_path_osx") != None):
			settings["node_path"] = sublime_settings.get("node_path_osx")
		elif (sublime.platform() == "windows" and sublime_settings.get("node_path_windows") != None):
			settings["node_path"] = sublime_settings.get("node_path_windows")
		elif (sublime.platform() == "linux" and sublime_settings.get("node_path_linux") != None):
			settings["node_path"] = sublime_settings.get("node_path_linux")

		self.thread = CommandLineInterface(self.dirs, selector, settings)
		self.thread.start()
		self.handle_threading()

	def print_line(self, output):
		edit = self.output_view.begin_edit()
		self.output_view.insert(edit, self.output_view.size(), output)
		self.output_view.end_edit(edit)

	def update_status(self, filesProcessed, totalFiles):
		self.output_view.set_status("element_finder", "Element Finder is searching... (%s/%s files)" % (filesProcessed, totalFiles))

	def handle_threading(self):
		while (len(self.thread.responses) > 0):
			json_line = self.thread.responses.pop(0)

			if "status" in json_line:

				if json_line["status"] == "countedFiles":
					self.update_status(0, json_line["numberOfFiles"])
					message = \
						"Selector:                  " + json_line["selector"] + "\n" + \
						"Directory:                 " + json_line["directory"] + "\n" + \
						"Filetypes to search:       " + json_line["extension"] + "\n" + \
						"Patterns to ignore:        " + json_line["ignore"] + "\n" + \
						"Number of files to search: " + str(json_line["numberOfFiles"]) + "\n\n" + \
						"Tip: to fold all result summaries, press Command K 1\n\n"
					self.print_line(message)

				elif json_line["status"] == "processingFile":
					self.update_status(json_line["fileNumber"], json_line["numberOfFiles"])

				elif json_line["status"] == "foundMatch":
					output = json_line["file"] + " (" + self.pluralise(json_line["matches"], "match", "matches") + ")\n\n"
					match_number = 1
					for match_detail in json_line["matchesDetails"]:
						output += "    " + (str(match_detail["line"]) + ":").ljust(8, " ") + match_detail["html"].replace("\n", "\n        ") + "\n"
						if (match_number == json_line["matches"]):
							output += "\n"
						match_number += 1
					self.print_line(output)

				elif json_line["status"] == "complete":
					self.print_line(json_line["message"])

				else:
					print "Status: " + json_line["status"]

		if self.thread.complete == True:
			self.output_view.erase_status("element_finder")
		else:
			sublime.set_timeout(self.handle_threading, 100)

	# Only display in the Side Bar context menu for directories, not files
	def is_visible(self = None, dirs = None, type = None):
		if type == "Side Bar":
			return len(dirs) == 1
		else:
			return True


class CommandLineInterface(threading.Thread):

	def __init__(self, paths, selector, settings):
		self.responses = []
		self.complete = False
		self.dirs = paths
		self.selector = selector
		self.settings = settings
		self.errors = ""
		threading.Thread.__init__(self)

	def run(self):

		# Create a Subprocess to call the command line app
		# http://docs.python.org/library/subprocess.html#subprocess.Popen
		try:
			self.sp = subprocess.Popen(
				[
					self.settings["node_path"],
					sublime.packages_path() + "/Element Finder/lib/elfinder/element-finder.js",
					"--selector", self.selector,
					"--extension", self.settings["extension"],
					"--ignore", self.settings["ignore"],
					"--json"
				],
				shell = (sublime.platform() == "windows"),
				bufsize = -1,
				stdout = subprocess.PIPE,
				stderr = subprocess.STDOUT,
				stdin = subprocess.PIPE)

		except OSError:
			sublime.error_message("Could not find Node JS at " + self.settings["node_path"] + ". Check your Element Finder preferences.")
			return

		# Poll process for new output until finished
		for line in iter(self.sp.stdout.readline, ""):
			self.processLine(line)

		self.sp.wait()

		if (self.errors != ""):
			sublime.error_message("Invalid response from Element Finder CLI:\n" + self.errors)

	# Process the JSON response from elfinder
	def processLine(self, line):

		try:
			json_line = json.loads(line)
		except ValueError:
			self.errors += line
			return

		self.responses.append(json_line)

		if "status" in json_line:
			if json_line["status"] == "complete":
				self.complete = True
