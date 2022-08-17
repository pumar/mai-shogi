#TODO switch to a template and use render
#from django.shortcuts import render
from django.http import HttpResponse
from django.template import loader

# Create your views here.
def index(request):
    template = loader.get_template('load_spa.html')
    context = {}
    return HttpResponse(template.render(context, request));
