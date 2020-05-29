_ = require 'underscore'
Backbone = require 'backbone'
$modelUtils = require './model.utils'
$configs = require './model.configs'
$viewUtils = require './view.utils'
$icons = require './view.icons'
$hxl = require './view.rowDetail.hxlDict'

$viewRowDetailSkipLogic = require './view.rowDetail.SkipLogic'
$viewTemplates = require './view.templates'
_t = require('utils').t

module.exports = do ->
  viewRowDetail = {}

  class viewRowDetail.DetailView extends Backbone.View
    ###
    The DetailView class is a base class for details
    of each row of the XLForm. When the view is initialized,
    a mixin from "DetailViewMixins" is applied.
    ###
    className: "card__settings__fields__field  dt-view dt-view--depr"
    initialize: ({@rowView})->
      unless @model.key
        throw new Error "RowDetail does not have key"
      modelKey = @model.key
      if modelKey == 'bind::oc:itemgroup'
        modelKey = 'oc_item_group'
      else if modelKey == 'bind::oc:external'
        modelKey = 'oc_external'
      else if modelKey == 'bind::oc:briefdescription'
        modelKey = 'oc_briefdescription'
      else if modelKey == 'bind::oc:description'
        modelKey = 'oc_description'
      @extraClass = "xlf-dv-#{modelKey}"
      _.extend(@, viewRowDetail.DetailViewMixins[modelKey] || viewRowDetail.DetailViewMixins.default)
      Backbone.on('ocCustomEvent', @onOcCustomEvent, @)
      @$el.addClass(@extraClass)

    render: ()->
      rendered = @html()
      if rendered
        @$el.html rendered

      @afterRender && @afterRender()
      @
    html: ()->
      $viewTemplates.$$render('xlfDetailView', @)
    listenForCheckboxChange: (opts={})->
      el = opts.el || @$('input[type=checkbox]').get(0)
      $el = $(el)
      changing = false
      _requiredBox = @model.key is "required"

      reflectValueInEl = ()=>
        if !changing
          val = @model.get('value')
          if val is true or val in $configs.truthyValues
            $el.prop('checked', true)
      @model.on 'change:value', reflectValueInEl
      reflectValueInEl()
      $el.on 'change', ()=>
        changing = true
        @model.set('value', $el.prop('checked'))
        if _requiredBox
          $el.parents('.card').eq(0).toggleClass('card--required', $el.prop('checked'))
        changing = false
    listenForInputChange: (opts={})->
      # listens to checkboxes and input fields and ensures
      # the model's value is reflected in the element and changes
      # to the element are reflected in the model (with transformFn
      # applied)
      el = opts.el || @$('input').get(0)

      $el = $(el)
      transformFn = opts.transformFn || false
      inputType = opts.inputType
      inTransition = false

      changeModelValue = ($elVal)=>
        # preventing race condition
        if !inTransition
          inTransition = true
          @model.set('value', $elVal)
          reflectValueInEl(true)
          inTransition = false

      reflectValueInEl = (force=false)=>
        # This should never change the model value
        if force || !inTransition
          modelVal = @model.get('value')
          if inputType is 'checkbox'
            if !_.isBoolean(modelVal)
              modelVal = modelVal in $configs.truthyValues
            # triggers element change event
            $el.prop('checked', modelVal)
          else
            # triggers element change event
            $el.val(modelVal)

      detectAndChangeValue = () =>
        $elVal = $el.val()
        if transformFn
          $elVal = transformFn($elVal)
        changeModelValue($elVal)

      reflectValueInEl()
      @model.on 'change:value', reflectValueInEl

      $el.on 'change', ()=>
        detectAndChangeValue()

      $el.on 'blur', ()=>
        detectAndChangeValue()

      $el.on 'keyup', (evt) =>
        if evt.key is 'Enter' or evt.keyCode is 13
          $el.blur()
        else
          if not transformFn
            detectAndChangeValue()

      return

    _insertInDOM: (where, how) ->
      where[how || 'append'](@el)
    insertInDOM: (rowView)->
      @_insertInDOM rowView.defaultRowDetailParent

    makeRequired: (opts={})->
      el = opts.el || @$('input').get(0)
      $el = $(el)

      showOrHideRequired = () =>
        if $el.val() is ''
          $el.closest('div').addClass('input-error')
          if $el.siblings('.message').length is 0
            $message = $('<div/>').addClass('message').text(_t("This field is required"))
            $el.after($message)
        else
          $el.closest('div').removeClass('input-error')
          $el.siblings('.message').remove()

      $el.on 'blur', ->
        showOrHideRequired()

      $el.on 'keyup', ->
        showOrHideRequired()

      showOrHideRequired()

    removeRequired: (opts={})->
      el = opts.el || @$('input').get(0)
      $el = $(el)
      $el.off 'blur'
      $el.closest('div').removeClass('input-error')
      $el.siblings('.message').remove()

  viewRowDetail.Templates = {
    textbox: (cid, key, key_label = key, input_class = '', placeholder_text='', max_length = '') ->
      if placeholder_text is not ''
        placeholder_text = _t(placeholder_text)
      if max_length is ''
        @field """<input type="text" name="#{key}" id="#{cid}" class="#{input_class}" placeholder="#{placeholder_text}" />""", cid, key_label
      else
        @field """<input type="text" name="#{key}" id="#{cid}" class="#{input_class}" placeholder="#{placeholder_text}" maxlength="#{max_length}" />""", cid, key_label

    checkbox: (cid, key, key_label = key, input_label = _t("Yes")) ->
      input_label = input_label
      @field """<input type="checkbox" name="#{key}" id="#{cid}"/> <label for="#{cid}">#{input_label}</label>""", cid, key_label

    radioButton: (cid, key, options, key_label = key, default_value = '') ->
      buttons = ""
      for option in options
        buttons += """<input type="radio" name="#{key}" id="option_#{option.label}" value="#{option.value}">"""
        buttons += """<label id="label_#{option.label}" for="#{option.label}">#{option.label}</label>"""

      @field buttons, cid, key_label

    dropdown: (cid, key, values, key_label = key) ->
      select = """<select name="#{key}" id="#{cid}">"""

      for value in values
        select += """<option value="#{value}">#{value}</option>"""

      select += "</select>"

      @field select, cid, key_label

    hxlTags: (cid, key, key_label = key, value = '', hxlTag = '', hxlAttrs = '') ->
      tags = """<input type="text" name="#{key}" id="#{cid}" class="hxlValue hidden" value="#{value}"  />"""
      tags += """ <div class="settings__hxl"><input id="#{cid}-tag" class="hxlTag" value="#{hxlTag}" type="hidden" />"""
      tags += """ <input id="#{cid}-attrs" class="hxlAttrs" value="#{hxlAttrs}" type="hidden" /></div>"""

      @field tags, cid, key_label

    field: (input, cid, key_label) ->
      """
      <div class="card__settings__fields__field">
        <label for="#{cid}">#{key_label}:</label>
        <span class="settings__input">
          #{input}
        </span>
      </div>
      """
  }

  viewRowDetail.DetailViewMixins = {}

  viewRowDetail.DetailViewMixins.type =
    html: -> false
    insertInDOM: (rowView)->
      typeStr = @model.get("typeId")
      if !(@model._parent.constructor.kls is "Group")
        faClass = $icons.get(typeStr)?.get("faClass")
        if !faClass
          console?.error("could not find icon for type: #{typeStr}")
          faClass = "fighter-jet"
        rowView.$el.find(".card__header-icon").addClass("fa-#{faClass}")


  viewRowDetail.DetailViewMixins.label =
    html: -> false
    insertInDOM: (rowView)->
      cht = rowView.$label
      cht.value = @model.get('value')
      return @
    afterRender: ->
      @listenForInputChange({
        el: this.rowView.$label,
        transformFn: (value) ->
          value = value.replace(new RegExp(String.fromCharCode(160), 'g'), '')
          value = value.replace /\t/g, ' '
          return value
      })
      return

  viewRowDetail.DetailViewMixins.hint =
    html: -> false
    insertInDOM: (rowView) ->
      hintEl = rowView.$hint
      hintEl.value = @model.get("value")
      return @
    afterRender: ->
      @listenForInputChange({
        el: this.rowView.$hint
      })
      return

  viewRowDetail.DetailViewMixins.constraint_message =
    html: ->
      @$el.addClass("card__settings__fields--active")
      viewRowDetail.Templates.textbox @cid, @model.key, _t("Constraint Message"), 'text'
    insertInDOM: (rowView)->
      @_insertInDOM rowView.cardSettingsWrap.find('.card__settings__fields--validation-criteria').eq(0)
    afterRender: ->
      @listenForInputChange()

  # parameters are handled per case
  viewRowDetail.DetailViewMixins.parameters =
    html: -> false
    insertInDOM: (rowView)-> return

  # body::accept is handled in custom view
  viewRowDetail.DetailViewMixins['body::accept'] =
    html: -> false
    insertInDOM: (rowView)-> return

  viewRowDetail.DetailViewMixins.relevant =
    html: ->
      @$el.addClass("card__settings__fields--active")
      """
      <div class="card__settings__fields__field relevant__editor">
      </div>
      """

    afterRender: ->
      @$el.find(".relevant__editor").html("""
        <div class="skiplogic__main"></div>
        <p class="skiplogic__extras">
        </p>
      """)

      @target_element = @$('.skiplogic__main')

      @model.facade.render @target_element

    insertInDOM: (rowView) ->
      @_insertInDOM rowView.cardSettingsWrap.find('.card__settings__fields--skip-logic').eq(0)

  viewRowDetail.DetailViewMixins.constraint =
    html: ->
      @$el.addClass("card__settings__fields--active")
      """
      <div class="card__settings__fields__field constraint__editor">
      </div>
      """
    afterRender: ->
      @$el.find(".constraint__editor").html("""
        <div class="skiplogic__main"></div>
        <p class="skiplogic__extras">
        </p>
      """)

      @target_element = @$('.skiplogic__main')

      @model.facade.render @target_element

    insertInDOM: (rowView) ->
      @_insertInDOM rowView.cardSettingsWrap.find('.card__settings__fields--validation-criteria')

  viewRowDetail.DetailViewMixins.name =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      if @model._parent.constructor.key == 'group'
        viewRowDetail.Templates.textbox @cid, @model.key, _t("Layout Group Name"), 'text', 'Enter layout group name'
      else
        viewRowDetail.Templates.textbox @cid, @model.key, _t("Item Name"), 'text', 'Enter variable name'
    afterRender: ->
      @listenForInputChange(transformFn: (value)=>
        value_chars = value.split('')
        if !/[\w_]/.test(value_chars[0])
          value_chars.unshift('_')

        @model.set 'value', value
        @model.deduplicate @model.getSurvey()
      )
      update_view = () => @$el.find('input').eq(0).val(@model.get("value") || '')
      update_view()

      @model._parent.get('label').on 'change:value', update_view
      @makeRequired()
  # insertInDom: (rowView)->
    #   # default behavior...
    #   rowView.defaultRowDetailParent.append(@el)

  viewRowDetail.DetailViewMixins.tags =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      label = _t("HXL")
      if (@model.get("value"))
        tags = @model.get("value")
        hxlTag = ''
        hxlAttrs = []
        hxlAttrsString = ''

        if _.isArray(tags)
          _.map(tags, (_t, i)->
            if (_t.indexOf('hxl:') > -1)
              _t = _t.replace('hxl:','')
              if (_t.indexOf('#') > -1)
                hxlTag = _t
              if (_t.indexOf('+') > -1)
                _t = _t.replace('+','')
                hxlAttrs.push(_t)
          )

        if _.isArray(hxlAttrs)
          hxlAttrsString = hxlAttrs.join(',')

        viewRowDetail.Templates.hxlTags @cid, @model.key, label, @model.get("value"), hxlTag, hxlAttrsString
      else
        viewRowDetail.Templates.hxlTags @cid, @model.key, label
    afterRender: ->
      @$el.find('input.hxlTag').select2({
          tags:$hxl.dict,
          maximumSelectionSize: 1,
          placeholder: _t("#tag"),
          tokenSeparators: ['+',',', ':'],
          formatSelectionTooBig: _t("Only one HXL tag allowed per question. ")
          createSearchChoice: @_hxlTagCleanup
        })
      @$el.find('input.hxlAttrs').select2({
          tags:[],
          tokenSeparators: ['+',',', ':'],
          formatNoMatches: _t("Type attributes for this tag"),
          placeholder: _t("Attributes"),
          createSearchChoice: @_hxlAttrCleanup
          allowClear: 1
        })

      @$el.find('input.hxlTag').on 'change', () => @_hxlUpdate()
      @$el.find('input.hxlAttrs').on 'change', () => @_hxlUpdate()

      @$el.find('input.hxlTag').on 'select2-selecting', (e) => @_hxlTagSelecting(e)
      @$el.find('.hxlTag input.select2-input').on 'keyup', (e) => @_hxlTagSanitize(e)

      @listenForInputChange({el: @$el.find('input.hxlValue').eq(0)})

    _hxlUpdate: (e)->
      tag = @$el.find('input.hxlTag').val()

      attrs = @$el.find('input.hxlAttrs').val()
      attrs = attrs.replace(/,/g, '+')
      hxlArray = [];

      if (tag)
        @$el.find('input.hxlAttrs').select2('enable', true)
        hxlArray.push('hxl:' + tag)
        if (attrs)
          aA = attrs.split('+')
          _.map(aA, (_a)->
            hxlArray.push('hxl:+' + _a)
          )
      else
        @$el.find('input.hxlAttrs').select2('enable', false)

      @model.set('value', hxlArray)
      @model.trigger('change')

    _hxlTagCleanup: (term)->
      if term.length >= 2
        regex = /\W+/g
        term = "#" + term.replace(regex, '').toLowerCase()
        return {id: term, text: term}

    _hxlTagSanitize: (e)->
      if e.target.value.length >= 2
        regex = /\W+/g
        e.target.value = "#" + e.target.value.replace(regex, '')

    _hxlTagSelecting: (e)->
      if e.val.length < 2
        e.preventDefault()

    _hxlAttrCleanup: (term)->
      regex = /\W+/g
      term = term.replace(regex, '').toLowerCase()
      return {id: term, text: term}


  viewRowDetail.DetailViewMixins.default =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      label = if @model.key == 'default' then _t("Default response") else @model.key.replace(/_/g, ' ')
      viewRowDetail.Templates.textbox @cid, @model.key, label, 'text'
    afterRender: ->
      @$el.find('input').eq(0).val(@model.get("value"))
      @listenForInputChange()

  viewRowDetail.DetailViewMixins._isRepeat =
    html: ->
      @$el.addClass("card__settings__fields--active")
      viewRowDetail.Templates.checkbox @cid, @model.key, _t("Repeat"), _t("Repeat this group if necessary")
    afterRender: ->
      @listenForCheckboxChange()

  # handled by mandatorySettingSelector
  viewRowDetail.DetailViewMixins.required =
    getOptions: () ->
      options = [
        {
          label: 'Always',
          value: 'yes'
        },
        {
          label: 'Conditional'
          value: 'conditional'
        },
        {
          label: 'Never',
          value: ''
        }
      ]
      options
    html: ->
      @$el.addClass("card__settings__fields--active")
      viewRowDetail.Templates.radioButton @cid, @model.key, @getOptions(), _t("Required")
    afterRender: ->
      options = @getOptions()
      el = @$("input[type=radio][name=#{@model.key}]")
      $el = $(el)
      $input = $('<input/>', {class:'text', type: 'text', style: 'width: auto; margin-left: 5px;'})
      changing = false

      reflectValueInEl = ()=>
        if !changing
          modelValue = @model.get('value')
          if modelValue == ''
            willSelectedEl = @$("input[type=radio][name=#{@model.key}][id='option_Never']")
          else if modelValue == 'yes'
            willSelectedEl = @$("input[type=radio][name=#{@model.key}][value=#{modelValue}]")
          else
            willSelectedEl = @$("input[type=radio][name=#{@model.key}][id='option_Conditional']")
            @$('#label_Conditional').append $input
            @listenForInputChange el: $input

          $willSelectedEl = $(willSelectedEl)
          $willSelectedEl.prop('checked', true)

      @model.on 'change:value', reflectValueInEl
      reflectValueInEl()

      $el.on 'change', ()=>
        changing = true
        selectedEl = @$("input[type=radio][name=#{@model.key}]:checked")
        $selectedEl = $(selectedEl)
        selectedVal = $selectedEl.val()
        if selectedVal is 'conditional'
          @model.set('value', '')
          @$('#label_Conditional').append $input
          @listenForInputChange el: $input
        else
          @model.set('value', selectedVal)
          $input.remove()
        changing = false

  viewRowDetail.DetailViewMixins.appearance =
    getTypes: () ->
      types =
        text: ['multiline']
        select_one: ['minimal', 'columns', 'columns-pack', 'columns-4', 'columns no-buttons', 'columns-pack no-buttons', 'columns-4 no-buttons', 'likert', 'image-map']
        select_multiple: ['minimal', 'columns', 'columns-pack', 'columns-4', 'columns no-buttons', 'columns-pack no-buttons', 'columns-4 no-buttons', 'image-map']
        image: ['draw', 'annotate', 'signature']
        date: ['month-year', 'year']

      types[@model_type()]
    html: ->
      @$checkbox_samescreen = $('<input/>', { type: "checkbox", id: "checkbox-samescreen", style: 'margin-top: 10px;' })
      @$label_checkbox_samescreen = $('<span/>', { style: 'margin-left: 4px;' }).text(_t('Show all questions in this group on the same screen'))
      @fieldListStr = 'field-list'
      @$select_width = $('<select/>', { id: "select-width", style: 'margin-top: 5px;' })
      @$label_select_width = $('<span/>', { style: 'display: block; margin-top: 10px;' }).text(_t('Width in columns (default is w4)'))
      $('<option />', {value: "select", text: "select"}).appendTo(@$select_width)
      @width_options = []
      for option in [1..10]
        @width_options.push "w#{option}"
      for width_option in @width_options
        $('<option />', {value: "#{width_option}", text: "#{width_option}"}).appendTo(@$select_width)
      @$textbox_other = null
      @select_width_default_value = 'w4'
      @is_input_select = false
      @is_input_text_other = false
      @is_checkbox_samescreen = false
      @$el.addClass("card__settings__fields--active")
      if @model_is_group(@model)
        return viewRowDetail.Templates.textbox @cid, @model.key, _t("Appearance (advanced)"), 'text'
      else
        if @model_type() isnt 'calculate'
          appearances = @getTypes()
          if appearances?
            appearances.push 'other'
            appearances.unshift 'select'
            @is_input_select = true
            return viewRowDetail.Templates.dropdown @cid, @model.key, appearances, _t("Appearance (advanced)")
          else
            return viewRowDetail.Templates.textbox @cid, @model.key, _t("Appearance (advanced)"), 'text'

    model_is_group: (model) ->
      model._parent.constructor.key == 'group'

    model_get_parent_group: () ->
      perent_group = null
      if @model._parent._parent._parent? and @model._parent._parent._parent.constructor.key == 'group'
        parent_group = parent_group = @model._parent._parent._parent
      parent_group

    model_get_parent_group_appearance: () ->
      parent_group = @model_get_parent_group()
      if parent_group?
        parent_group.get('appearance').getValue()

    model_type: () ->
      @model._parent.getValue('type').split(' ')[0]

    is_form_style_exist: () ->
      sessionStorage.getItem('kpi.editable-form.form-style') != ''

    is_form_style: (style) ->
      sessionStorage.getItem('kpi.editable-form.form-style').indexOf(style) isnt -1

    is_form_style_pages: () ->
      @is_form_style('pages')

    is_form_style_theme_grid: () ->
      @is_form_style('theme-grid')

    not_group_inputs_change_handler: () ->
      model_set_value = ''

      if @is_input_select
        if @is_input_text_other
          textbox_other_value = @$textbox_other.val().trim()
          model_set_value = textbox_other_value
        else
          $select = @$('select').not('#select-width')
          select_value = $select.val()
          select_value = '' if select_value == 'select'
          model_set_value = select_value
      else # input text
        $input = @$('input')
        input_value = $input.val().trim()
        model_set_value = input_value

      select_width_value = @$select_width.val()
      select_width_value = @select_width_default_value if select_width_value == 'select'
      if model_set_value != ''
        model_set_value += " #{select_width_value}"
      else
        model_set_value = select_width_value
      
      @model.set 'value', model_set_value

    group_inputs_change_handler: () ->
      model_set_value = ''

      if @is_checkbox_samescreen
        show_samescreen = @$checkbox_samescreen.prop('checked')
        if show_samescreen
          model_set_value = @fieldListStr

      $input = @$('input')
      input_value = $input.val().trim()
      if model_set_value != ''
        if input_value != ''
          model_set_value += " #{input_value}"
      else
        model_set_value = input_value
      
      select_width_value = @$select_width.val()
      select_width_value = @select_width_default_value if select_width_value == 'select'
      if model_set_value != ''
        if select_width_value != ''
          model_set_value += " #{select_width_value}"
      else
        model_set_value = select_width_value

      @model.set 'value', model_set_value

    add_input_text_change_handler: ($input, handler) ->
      handler = handler.bind @
      $input.off 'change'
      $input.on 'change', () =>
        handler()
      $input.off 'blur'
      $input.on 'blur', () =>
        handler()
      $input.off 'keyup'
      $input.on 'keyup', (evt) =>
        if evt.key is 'Enter' or evt.keyCode is 13
          $input.blur()
        else
          handler()

    afterRender: ->
      modelValue = @model.get 'value'
      if @model_is_group(@model)
        $input = @$('input')

        if @is_form_style_theme_grid()
          @$('.settings__input').append(@$label_select_width)
          @$('.settings__input').append(@$select_width)

        if @is_form_style_exist() and @is_form_style_pages()
          $container_checkbox_samescreen = $('<div/>')
          $container_checkbox_samescreen.append(@$checkbox_samescreen)
          $container_checkbox_samescreen.append(@$label_checkbox_samescreen)
          @$('.settings__input').append($container_checkbox_samescreen)
          @is_checkbox_samescreen = true

        if modelValue? and modelValue != '' # Parse existing value
          samescreen_value = null
          text_input_value = null
          select_width_value = null
          if modelValue.indexOf(' ') == -1 # no space in modelValue
            if modelValue == @fieldListStr
              samescreen_value = modelValue
            else if modelValue in @width_options
              select_width_value = modelValue
            else
              text_input_value = modelValue
          else
            count_spaces = modelValue.split(' ').length - 1
            if count_spaces == 1
              first_value = modelValue.slice(0, modelValue.indexOf(' '))
              if first_value == @fieldListStr
                samescreen_value = first_value

              last_value = modelValue.slice(modelValue.lastIndexOf(' ') + 1)
              if last_value in @width_options
                select_width_value = last_value
                if not samescreen_value?
                  text_input_value = modelValue.slice(0, modelValue.lastIndexOf(' '))
              else
                if samescreen_value?
                  text_input_value = last_value
                else
                  text_input_value = modelValue
            else
              first_value = modelValue.slice(0, modelValue.indexOf(' '))
              if first_value == @fieldListStr
                samescreen_value = first_value

              last_value = modelValue.slice(modelValue.lastIndexOf(' ') + 1)
              if last_value in @width_options
                select_width_value = last_value
                if samescreen_value?
                  text_input_value = modelValue.slice(modelValue.indexOf(' ') + 1, modelValue.lastIndexOf(' '))
                else
                  text_input_value = modelValue.slice(0, modelValue.lastIndexOf(' '))
              else
                if samescreen_value?
                  text_input_value = modelValue.slice(modelValue.indexOf(' ') + 1)
                else
                  text_input_value = modelValue

        if samescreen_value?
          @$checkbox_samescreen.prop('checked', true)
        if text_input_value?
          $input.val(text_input_value)
        if select_width_value?
          @$select_width.val(select_width_value)

        @add_input_text_change_handler($input, @group_inputs_change_handler)
        
        @$select_width.off 'change'
        @$select_width.on 'change', () =>
          @group_inputs_change_handler()
        
        @$checkbox_samescreen.off 'change'
        @$checkbox_samescreen.on 'change', () =>
          @group_inputs_change_handler()

      else # not group. this is question item appearance settings
        if @is_form_style_theme_grid()
          @$('.settings__input').append(@$label_select_width)
          @$('.settings__input').append(@$select_width)

          parent_column = 4
          if @model_get_parent_group()? and @model_get_parent_group_appearance() != ''
            parent_group_appearance = @model_get_parent_group_appearance()
            if parent_group_appearance.indexOf(' ') == -1 # no space in parent_group_appearance
              if parent_group_appearance in @width_options
                parent_column = parent_group_appearance.slice(1)
            else
              parent_group_appearance_last_value = parent_group_appearance.slice(parent_group_appearance.lastIndexOf(' ') + 1)
              if parent_group_appearance_last_value in @width_options
                parent_column = parent_group_appearance_last_value.slice(1)

          parent_column = parseInt parent_column, 10
          text_parent_columns = "Parent group has #{parent_column} columns"
          if parent_column == 1
            text_parent_columns = text_parent_columns.replace('columns', 'column')
          $label_parent_columns = $('<span/>', { style: 'margin-left: 5px;' }).text(_t("#{text_parent_columns}"))
          @$('.settings__input').append($label_parent_columns)

        $select = @$('select').not('#select-width')
        if $select.length > 0 # Question item appearance is dropdown
          @$textbox_other = $('<input/>', { class:'text', type: 'text', width: 'auto', style: 'display: block; margin-top: 5px;' })

          if modelValue? and modelValue != '' # Parse existing value
            select_value = null
            other_value = null
            select_width_value = null
            if modelValue.indexOf(' ') != -1 # found space in modelValue
              select_value = modelValue.slice(0, modelValue.indexOf(' '))
              if select_value not in @getTypes()
                other_value = modelValue.slice(0, modelValue.lastIndexOf(' '))
              select_width_value = modelValue.slice(modelValue.lastIndexOf(' ') + 1)
            else
              select_width_value = modelValue

            if select_value?
              $select.val(select_value)
            if select_width_value?
              @$select_width.val(select_width_value)
            if other_value?
              $select.val('other')
              @$textbox_other.insertAfter $select
              @$textbox_other.val(other_value)
              @is_input_text_other = true
              @add_input_text_change_handler(@$textbox_other, @not_group_inputs_change_handler)

          @$select_width.on 'change', () =>
            @not_group_inputs_change_handler()

          $select.on 'change', () =>
            if $select.val() == 'other'
              @$textbox_other.insertAfter $select
              @is_input_text_other = true
              @add_input_text_change_handler(@$textbox_other, @not_group_inputs_change_handler)
            else
              @$textbox_other.val('')
              @$textbox_other.remove()
              @is_input_text_other = false
              @not_group_inputs_change_handler()

        else # Question item appearance is text input
          $input = @$('input')
          if modelValue? and modelValue != '' # Parse existing value
            input_value = null
            select_width_value = null
            if modelValue.indexOf(' ') != -1 # found space in modelValue
              input_value = modelValue.slice(0, modelValue.lastIndexOf(' '))
              select_width_value = modelValue.slice(modelValue.lastIndexOf(' ') + 1)
            else
              select_width_value = modelValue

            if input_value?
              $input.val(input_value)
            if select_width_value?
              @$select_width.val(select_width_value)

          @add_input_text_change_handler($input, @group_inputs_change_handler)

          @$select_width.on 'change', () =>
            @group_inputs_change_handler()


  viewRowDetail.DetailViewMixins.oc_item_group =
    onOcCustomEvent: (ocCustomEventArgs) ->
      if (ocCustomEventArgs.sender is 'bind::oc:external') and (@model._parent.get('type').get('value') isnt 'calculate')
        if ocCustomEventArgs.value isnt ''
          @removeRequired()
        else
          @makeRequired()
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      viewRowDetail.Templates.textbox @cid, @model.key, _t("Item Group"), 'text', 'Enter data set name'
    afterRender: ->
      @listenForInputChange()

  viewRowDetail.DetailViewMixins.oc_briefdescription =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      viewRowDetail.Templates.textbox @cid, @model.key, _t("Item Brief Description"), 'text', 'Enter variable title (may be used in display table column headers) (optional)', '40'
    afterRender: ->
      @listenForInputChange()

  viewRowDetail.DetailViewMixins.oc_external =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      options = ['No', 'clinicaldata']
      return viewRowDetail.Templates.dropdown @cid, @model.key, options, _t("Use External Value")
    afterRender: ->
      $select = @$('select')
      modelValue = @model.get 'value'
      Backbone.trigger('ocCustomEvent', { sender: @model.key, value: @model.get 'value' })
      if $select.length > 0
        if modelValue == ''
          $select.val('No')
        else
          $select.val(modelValue)

        $select.change () =>
          if $select.val() == 'No'
            @model.set 'value', ''
          else
            @model.set 'value', $select.val()
          Backbone.trigger('ocCustomEvent', { sender: @model.key, value: @model.get 'value' })

  viewRowDetail.DetailViewMixins.readonly =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      viewRowDetail.Templates.checkbox @cid, @model.key, _t("Read only")
    afterRender: ->
      @listenForCheckboxChange()

  viewRowDetail.DetailViewMixins.calculation =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      viewRowDetail.Templates.textbox @cid, @model.key, _t("Calculation"), 'text'
    afterRender: ->
      questionType = @model._parent.get('type').get('typeId')

      @listenForInputChange()
      if questionType is 'calculate'
        @makeRequired()

  viewRowDetail.DetailViewMixins.oc_description =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      viewRowDetail.Templates.textbox @cid, @model.key, _t("Item Description"), 'text', 'Enter variable definition (e.g., CDASH data definition) (optional)', '3999'
    afterRender: ->
      @listenForInputChange()

  viewRowDetail.DetailViewMixins.select_one_from_file_filename =
    html: ->
      @fieldTab = "active"
      @$el.addClass("card__settings__fields--#{@fieldTab}")
      viewRowDetail.Templates.textbox @cid, @model.key, _t("External List Filename"), 'text', 'Enter external list filename'
    afterRender: ->
      @listenForInputChange()
      @makeRequired()

  viewRowDetail
